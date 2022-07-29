/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
#![warn(clippy::all)]

use std::time::Duration;

use axum::{
    body::{Body, Bytes},
    http,
    http::{Request, StatusCode},
    response::Response,
    Router,
};
use chrono::DateTime;
use serde_json::{json, Map, Value};
use sqlx::{postgres::PgPoolOptions, Executor, PgPool};
use tower::ServiceExt; // for `app.oneshot()`

async fn setup_test_db(schema_suffix: &str) -> PgPool {
    // Modeled after example in https://docs.rs/sqlx/latest/sqlx/pool/struct.PoolOptions.html#method.after_connect
    // This makes all queries in tests hit their own `testing` schema
    let why_rust_whyyy = format!("SET search_path TO testing_{};", schema_suffix);
    let pool = PgPoolOptions::new()
        .after_connect(move |conn| {
            let why_rust_whyyy = why_rust_whyyy.clone();
            Box::pin(async move {
                conn.execute(why_rust_whyyy.as_str()).await?;
                Ok(())
            })
        })
        .connect_timeout(Duration::from_secs(10))
        .connect("postgres://localhost/birdie")
        .await
        .unwrap();

    // And dropping/recreating clears the schema before each test run
    pool.execute(format!("DROP SCHEMA IF EXISTS testing_{} CASCADE;", schema_suffix).as_str())
        .await
        .unwrap();

    pool.execute(format!("CREATE SCHEMA testing_{};", schema_suffix).as_str())
        .await
        .unwrap();

    birdie::migrate(&pool).await.unwrap();

    pool
}

async fn cleanup(pool: PgPool, schema_suffix: &str) {
    pool.execute(format!("DROP SCHEMA IF EXISTS testing_{} CASCADE;", schema_suffix).as_str())
        .await
        .unwrap();

    pool.close().await;
}

async fn get_app(pool: &PgPool) -> Router {
    birdie::app(pool.clone(), "./js/build").await.unwrap()
}

async fn body_bytes(response: Response) -> Bytes {
    hyper::body::to_bytes(response.into_body()).await.unwrap()
}

fn get_string_key(map: &mut Map<String, Value>, key: &str) -> String {
    match map.remove(key).unwrap() {
        Value::String(s) => s,
        x => panic!("{} wasn't a string, it was {}", key, x),
    }
}

fn get_number_key(map: &mut Map<String, Value>, key: &str) -> serde_json::value::Number {
    match map.remove(key).unwrap() {
        Value::Number(n) => n,
        x => panic!("{} wasn't a string, it was {}", key, x),
    }
}

// Following examples https://github.com/tokio-rs/axum/blob/main/examples/testing
#[tokio::test]
async fn ping_pong() {
    let pool = setup_test_db("ping_pong").await;
    // `Router` implements `tower::Service<Request<Body>>` so we can
    // call it like any tower service, no need to run an HTTP server.
    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .uri("/api/ping")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = body_bytes(response).await;
    assert_eq!(&body[..], b"pong");

    cleanup(pool, "ping_pong").await;
}

#[tokio::test]
async fn outings() {
    let pool = setup_test_db("outings").await;
    // Empty
    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .uri("/api/outings")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_bytes(response).await;
    let body: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(body, json!([]));

    // One entry
    let test_person_one = "test person";
    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/api/outings")
                .header(http::header::CONTENT_TYPE, mime::APPLICATION_JSON.as_ref())
                .body(Body::from(
                    serde_json::to_vec(&json!({"name": "foo", "person_name": test_person_one}))
                        .unwrap(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let created_body = body_bytes(response).await;

    // Make sure the created body is ok
    let created_body_parsed: Value = serde_json::from_slice(&created_body).unwrap();
    let mut body = created_body_parsed.clone();
    let map = body.as_object_mut().unwrap();
    let outing_id = get_string_key(map, "outing_id");
    let created_at = get_string_key(map, "created_at");

    let dec_outing_id = birdie::models::HARSH
        .decode(&outing_id)
        .unwrap_or_else(|_| panic!("outing_id wasn't a valid hashid, it was {}", &outing_id))
        .pop()
        .unwrap();

    assert_eq!(body, json!({"name": "foo"}));
    assert!(
        DateTime::parse_from_rfc3339(&created_at).is_ok(),
        "created_at wasn't a valid datetime, it was {}",
        &created_at
    );

    // Join
    let test_person_two = "testy mctestface";
    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .method(http::Method::PUT)
                .uri(format!("/api/outings/{}/join", &outing_id))
                .header(http::header::CONTENT_TYPE, mime::APPLICATION_JSON.as_ref())
                .body(Body::from(
                    serde_json::to_vec(&json!({ "name": test_person_two })).unwrap(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NO_CONTENT);

    let expt_people = vec![
        birdie::models::Named {
            name: test_person_one.to_string(),
        },
        birdie::models::Named {
            name: test_person_two.to_string(),
        },
    ];

    let sql_people: Vec<birdie::models::Named> =
        sqlx::query_as("SELECT name FROM outing_people WHERE outing_id = $1")
            .bind(dec_outing_id as i32)
            .fetch_all(&pool)
            .await
            .unwrap();

    assert_eq!(sql_people, expt_people);

    // Repeat join should be a no-op without error
    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .method(http::Method::PUT)
                .uri(format!("/api/outings/{}/join", &outing_id))
                .header(http::header::CONTENT_TYPE, mime::APPLICATION_JSON.as_ref())
                .body(Body::from(
                    serde_json::to_vec(&json!({ "name": test_person_two })).unwrap(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NO_CONTENT);

    let sql_people: Vec<birdie::models::Named> =
        sqlx::query_as("SELECT name FROM outing_people WHERE outing_id = $1")
            .bind(dec_outing_id as i32)
            .fetch_all(&pool)
            .await
            .unwrap();

    assert_eq!(sql_people, expt_people);

    // Next we can make sure that the retrieve & list routes return the same thing
    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .uri(format!("/api/outings/{}", &outing_id))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_bytes(response).await;
    // The retrieve route also returns the people list:
    let mut body_parsed: Value = serde_json::from_slice(&body).unwrap();
    let people = body_parsed
        .as_object_mut()
        .unwrap()
        .remove("people")
        .unwrap();
    assert_eq!(people, json!([test_person_one, test_person_two]));
    assert_eq!(created_body_parsed, body_parsed);

    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .uri("/api/outings")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_bytes(response).await;
    // The list route doesn't include people, but it does wrap in an array
    let body: Value = serde_json::from_slice(&body).unwrap();
    let body = body.get(0).unwrap();
    assert_eq!(&created_body_parsed, body);

    // Many entries
    pool.execute("INSERT INTO outings (name) VALUES ('bar'), ('baz')")
        .await
        .unwrap();

    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .uri("/api/outings")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = body_bytes(response).await;
    let mut body: Value = serde_json::from_slice(&body).unwrap();
    for val in body.as_array_mut().unwrap() {
        if let Value::Object(m) = val {
            let outing_id = get_string_key(m, "outing_id");
            assert!(
                birdie::models::HARSH.decode(&outing_id).is_ok(),
                "outing_id wasn't a valid hashid, it was {}",
                outing_id
            );

            let created_at = get_string_key(m, "created_at");
            assert!(
                DateTime::parse_from_rfc3339(&created_at).is_ok(),
                "created_at wasn't a valid datetime, it was {}",
                &created_at
            );
        } else {
            panic!("Non-object member of outings list body!")
        }
    }

    assert_eq!(
        body,
        json!([{"name": "foo"}, {"name": "bar"}, {"name": "baz"}])
    );

    cleanup(pool, "outings").await;
}

async fn post_expense(pool: &PgPool, inp: &Value) -> Response {
    let response = get_app(pool)
        .await
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/api/expenses")
                .header(http::header::CONTENT_TYPE, mime::APPLICATION_JSON.as_ref())
                .body(Body::from(serde_json::to_vec(inp).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(
        response.status(),
        StatusCode::OK,
        "response not OK, got {}",
        std::str::from_utf8(&body_bytes(response).await[..]).unwrap()
    );

    response
}

#[tokio::test]
async fn expenses() {
    let pool = setup_test_db("expenses").await;

    pool.execute("INSERT INTO outings(name) VALUES ('foo')")
        .await
        .unwrap();

    let outing_id = birdie::models::HARSH.encode(&[1]);

    let person_name = "person A";
    let amount: f64 = 24.65;
    let desc = "fizzbuzz";

    let inp = json!({
        "outing_id": &outing_id,
        "person_name": &person_name,
        "amount": &amount,
        "description": &desc
    });
    let response = post_expense(&pool, &inp).await;
    let body = body_bytes(response).await;
    let mut body_parsed: Value = serde_json::from_slice(&body).unwrap();
    let map = body_parsed.as_object_mut().unwrap();

    let expense_id = get_number_key(map, "expense_id");
    let created_at = get_string_key(map, "created_at");

    assert_eq!(expense_id, serde_json::value::Number::from(1));

    assert!(
        DateTime::parse_from_rfc3339(&created_at).is_ok(),
        "created_at wasn't a valid datetime, it was {}",
        &created_at
    );

    assert_eq!(body_parsed, inp);

    // Check the outing /balance and /expenses routes

    let person_two = "person B";
    let amount_two: f64 = 19.02;
    let inp = json!({
        "outing_id": &outing_id,
        "person_name": &person_two,
        "amount": &amount_two
    });
    post_expense(&pool, &inp).await;

    let person_three = "person C";
    let amount_three: f64 = 25.05;
    let inp = json!({
        "outing_id": &outing_id,
        "person_name": &person_three,
        "amount": &amount_three
    });
    post_expense(&pool, &inp).await;

    let total = amount + amount_two + amount_three;

    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .uri(format!("/api/outings/{}/balance", &outing_id))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = body_bytes(response).await;
    let body_parsed: Value = serde_json::from_slice(&body).unwrap();

    assert_eq!(body_parsed, json!({ "total": &total }));

    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .uri(format!("/api/outings/{}/expenses", &outing_id))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = body_bytes(response).await;
    let mut body_parsed: Value = serde_json::from_slice(&body).unwrap();
    for val in body_parsed.as_array_mut().unwrap() {
        let created_at = get_string_key(val.as_object_mut().unwrap(), "created_at");
        assert!(
            DateTime::parse_from_rfc3339(&created_at).is_ok(),
            "created_at wasn't a valid datetime, it was {}",
            &created_at
        );
    }

    assert_eq!(
        body_parsed,
        json!([
            { "expense_id": 1, "outing_id": &outing_id, "person_name": &person_name, "amount": &amount, "description": &desc },
            { "expense_id": 2, "outing_id": &outing_id, "person_name": &person_two, "amount": &amount_two, "description": null },
            { "expense_id": 3, "outing_id": &outing_id, "person_name": &person_three, "amount": &amount_three, "description": null }
        ])
    );

    // Test the final output of outing results
    let response = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .uri(format!("/api/outings/{}/finish", &outing_id))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = body_bytes(response).await;
    let body_parsed: Value = serde_json::from_slice(&body).unwrap();

    // expected:
    // B pays 3.8867 to C
    // C pays 1.7434 to A
    assert_eq!(
        body_parsed,
        json!([
            { "from": &person_two, "to": &person_three, "amount": 3.8867 },
            { "from": &person_three, "to": &person_name, "amount": 1.7434 }
        ])
    );

    cleanup(pool, "expenses").await;
}

#[tokio::test]
async fn index_fallback() {
    let pool = setup_test_db("file_server").await;

    let response_one = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .uri("/index.html")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response_one.status(), StatusCode::OK);

    // We'll compare some to other routes to this one to be sure they serve the same file
    let body_one = body_bytes(response_one).await;

    let response_two = get_app(&pool)
        .await
        .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(response_two.status(), StatusCode::OK);

    let body_two = body_bytes(response_two).await;
    assert_eq!(body_one, body_two, "/ didn't serve index.html!");

    let response_three = get_app(&pool)
        .await
        .oneshot(
            Request::builder()
                .uri("/random/garbage")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response_three.status(), StatusCode::OK);

    let body_three = body_bytes(response_three).await;
    assert_eq!(
        body_one, body_three,
        "/random/garbage didn't serve index.html!"
    );

    cleanup(pool, "file_server").await;
}
