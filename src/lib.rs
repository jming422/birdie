#[macro_use]
extern crate rocket;

use rocket::{Build, Rocket};

#[get("/hello")]
fn hello() -> &'static str {
    "Hello, world!"
}

#[shuttle_service::main]
async fn init() -> Result<Rocket<Build>, shuttle_service::Error> {
    let rocket = rocket::build().mount("/", routes![hello]);

    Ok(rocket)
}
