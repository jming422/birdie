use std::net::SocketAddr;

use axum::Server;
use sqlx::postgres::PgPoolOptions;

use birdie::app;

#[tokio::main]
async fn main() {
    // birdie::unpack_frontend().unwrap();

    println!("Connecting to Postgres");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect("postgres://localhost:/birdie")
        .await
        .unwrap();

    let router = app(pool).await.unwrap();

    let addr = SocketAddr::from(([127, 0, 0, 1], 5000));
    println!("Listening on {}", addr);
    Server::bind(&addr)
        .serve(router.into_make_service())
        .await
        .unwrap();
}
