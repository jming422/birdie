/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 *
 * NOTE: This main function is meant for local development only
 */
use std::net::SocketAddr;

use axum::Server;
use sqlx::postgres::PgPoolOptions;

use birdie::app;

#[tokio::main]
async fn main() {
    println!("Connecting to Postgres");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect("postgres://localhost:/birdie")
        .await
        .unwrap();

    // birdie::unpack_frontend(&pool).await.unwrap();

    let router = app(pool).await.unwrap();

    let addr = SocketAddr::from(([127, 0, 0, 1], 5000));
    println!("Listening on {}", addr);
    Server::bind(&addr)
        .serve(router.into_make_service())
        .await
        .unwrap();
}
