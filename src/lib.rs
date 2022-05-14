#[macro_use]
extern crate rocket;

use rocket::http::Status;
use rocket::response::status::{BadRequest, Custom};
use rocket::serde::json::Json;
use rocket::{Build, Rocket, State};
use serde::{Deserialize, Serialize};
use shuttle_service::error::CustomError;
use sqlx::{Executor, FromRow, PgPool};

#[derive(Serialize, FromRow)]
struct Plant {
    pub id: i32,
    pub name: String,
    pub outside: bool,
}

#[derive(Deserialize)]
struct PlantNew {
    pub name: String,
    pub outside: bool,
}

#[get("/<id>")]
async fn get_plant(id: i32, state: &State<BirdieState>) -> Result<Json<Plant>, BadRequest<String>> {
    let plant = sqlx::query_as("SELECT * FROM plants WHERE id = $1")
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| BadRequest(Some(e.to_string())))?;

    Ok(Json(plant))
}

#[post("/", data = "<data>")]
async fn create_plant(
    data: Json<PlantNew>,
    state: &State<BirdieState>,
) -> Result<Json<Plant>, BadRequest<String>> {
    let plant = sqlx::query_as("INSERT INTO plants (name, outside) VALUES ($1, $2) RETURNING *")
        .bind(&data.name)
        .bind(&data.outside)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| BadRequest(Some(e.to_string())))?;

    Ok(Json(plant))
}

#[get("/")]
async fn list_plants(state: &State<BirdieState>) -> Result<Json<Vec<Plant>>, Custom<String>> {
    let plants = sqlx::query_as("SELECT * FROM plants LIMIT 100")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| {
            Custom(
                Status::InternalServerError,
                format!("Database error: {}", e.to_string()),
            )
        })?;

    Ok(Json(plants))
}

struct BirdieState {
    pool: PgPool,
}

#[shuttle_service::main]
async fn init(pool: PgPool) -> Result<Rocket<Build>, shuttle_service::Error> {
    pool.execute(include_str!("../schema.sql"))
        .await
        .map_err(CustomError::new)?;

    let state = BirdieState { pool };

    let rocket = rocket::build()
        .mount("/plant", routes![get_plant, create_plant])
        .mount("/plants", routes![list_plants])
        .manage(state);

    Ok(rocket)
}
