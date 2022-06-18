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
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use birdie::{app, migrate};

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "birdie=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Connecting to Postgres");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect("postgres://localhost/birdie")
        .await
        .unwrap();

    // birdie::unpack_frontend(&pool).await.unwrap();

    migrate(&pool).await.unwrap();

    let router = app(pool, "./js/build").await.unwrap();

    let addr = SocketAddr::from(([127, 0, 0, 1], 5000));
    info!("Listening on {}", addr);
    Server::bind(&addr)
        .serve(router.into_make_service())
        .await
        .unwrap();
}
