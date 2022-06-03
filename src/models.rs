/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
use harsh::Harsh;
use serde::{Deserialize, Serialize};
use sqlx::types::chrono::{DateTime, Utc};
use sqlx::types::Decimal;
use sqlx::FromRow;
use std::fmt::Display;

lazy_static! {
    static ref HARSH: Harsh = Harsh::builder()
        .salt("birdie hashids")
        .alphabet("abcdefghijklmnopqrstuvwxyz1234567890")
        .length(4)
        .build()
        .unwrap();
}

#[derive(Debug)]
pub enum IdParseError {
    Harsh(harsh::Error),
    User(&'static str),
}

impl Display for IdParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            // Idk what kinds of error messages Harsh returns so let's just
            // display them as a generic "that doesn't work ya dingus" message
            IdParseError::Harsh(_) => write!(f, "Invalid ID string provided"),
            IdParseError::User(s) => write!(f, "{}", s),
        }
    }
}

impl From<harsh::Error> for IdParseError {
    fn from(e: harsh::Error) -> Self {
        Self::Harsh(e)
    }
}

// Users must only be shown & must only be able to provide outing IDs as their
// hashid string values. Since our hashid alphabet contains numbers, users might
// put in a string that's all numbers, even though that is really a hashid and
// not a raw Postgres outing ID. To make sure we handle everything properly,
// instruct serde to always serialize & deserialize OutingIds by passing through
// the String type first.
//
// The first serde macro `try_from` says: When deserializing, always deserialize
// the input as a String, then convert it to an OutingId using my
// TryFrom<String> impl for OutingId
//
// The second serde macro `into` says: When serializing, always convert the
// OutingId to a String using my From<OutingId> impl for String, then serialize
// that String
#[derive(Clone, Serialize, Deserialize, sqlx::Type)]
#[serde(try_from = "String")]
#[serde(into = "String")]
#[sqlx(transparent)] // have sqlx transparently encode/decode this type using the i32 impl
pub struct OutingId(i32);

impl TryFrom<i32> for OutingId {
    type Error = IdParseError;
    fn try_from(id: i32) -> Result<OutingId, IdParseError> {
        if id < 0 {
            Err(IdParseError::User("Outing IDs must not be negative"))
        } else {
            Ok(Self(id))
        }
    }
}

impl TryFrom<String> for OutingId {
    type Error = IdParseError;
    fn try_from(s: String) -> Result<OutingId, IdParseError> {
        let res = HARSH.decode(s)?;
        if res.len() != 1 || res[0] > i32::MAX as u64 {
            Err(IdParseError::User("Invalid outing ID provided"))
        } else {
            Ok(OutingId(res[0] as i32))
        }
    }
}

impl From<OutingId> for String {
    fn from(input: OutingId) -> String {
        HARSH.encode(&[input.0 as u64])
    }
}

#[derive(Deserialize)]
pub struct OutingNew {
    pub name: String,
    pub person_name: String, // Becomes an OutingPerson
}

#[derive(Serialize, FromRow)]
pub struct Outing {
    pub outing_id: OutingId,
    pub created_at: DateTime<Utc>,
    pub name: String,
}

#[derive(FromRow)]
pub struct Named {
    pub name: String,
}

#[derive(Serialize)]
pub struct OutingDetails {
    pub outing_id: OutingId,
    pub created_at: DateTime<Utc>,
    pub name: String,
    pub people: Vec<String>,
}

impl OutingDetails {
    pub fn new(outing: Outing, names: Vec<Named>) -> Self {
        Self {
            outing_id: outing.outing_id,
            created_at: outing.created_at,
            name: outing.name,
            people: names.into_iter().map(|s| s.name).collect(),
        }
    }
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct OutingPerson {
    pub outing_id: OutingId,
    pub name: String,
}

#[derive(Serialize, FromRow)]
pub struct Expense {
    pub expense_id: i32,
    pub created_at: DateTime<Utc>,
    pub outing_id: OutingId,
    pub person_name: String,
    pub amount: Decimal,
    pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct ExpenseNew {
    pub outing_id: OutingId,
    pub person_name: String,
    pub amount: Decimal,
    pub description: Option<String>,
}

#[derive(Serialize, FromRow)]
pub struct Balance {
    pub total: Decimal,
}

#[derive(FromRow, Debug)]
pub struct PersonDiff {
    pub name: String,
    pub diff_from_avg: Decimal,
}

#[derive(Serialize, Deserialize)]
pub struct OutingResult {
    pub from: String,
    pub to: String,
    pub amount: Decimal,
}
