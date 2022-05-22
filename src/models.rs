use serde::{Deserialize, Serialize};
use sqlx::types::chrono::{DateTime, Utc};
use sqlx::types::Decimal;
use sqlx::FromRow;

#[derive(Serialize, FromRow)]
pub struct Outing {
    pub outing_id: i32,
    pub created_at: DateTime<Utc>,
    pub name: String,
}

#[derive(Serialize)]
pub struct OutingDetails {
    pub outing_id: i32,
    pub created_at: DateTime<Utc>,
    pub name: String,
    pub people: Vec<Person>,
}

impl OutingDetails {
    pub fn new(outing: Outing, people: Vec<Person>) -> Self {
        Self {
            outing_id: outing.outing_id,
            created_at: outing.created_at,
            name: outing.name,
            people,
        }
    }
}

#[derive(Deserialize)]
pub struct OutingNew {
    pub name: String,
    pub initiator: i32, // Maps to an OutingPerson's person_id column
}

#[derive(Serialize, FromRow)]
pub struct Person {
    pub person_id: i32,
    pub name: String,
}

#[derive(Deserialize)]
pub struct PersonNew {
    pub name: String,
}

#[derive(Serialize, FromRow)]
pub struct Expense {
    pub expense_id: i32,
    pub created_at: DateTime<Utc>,
    pub outing_id: i32,
    pub person_id: i32,
    pub amount: Decimal,
    pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct ExpenseNew {
    pub outing_id: i32,
    pub person_id: i32,
    pub amount: Decimal,
    pub description: Option<String>,
}

#[derive(Serialize, FromRow)]
pub struct Balance {
    pub amount: Decimal,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct OutingPerson {
    pub outing_id: i32,
    pub person_id: i32,
}
