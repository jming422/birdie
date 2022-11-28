/*
 * Copyright © 2022 Jonathan Ming
 *
 * This file is part of Birdie.
 *
 * For information about warranty and licensing, see the disclaimer in
 * src/lib.rs as well as the LICENSE file.
 */
use aws_sdk_s3::{output::GetObjectOutput, Client, Credentials};

use shuttle_secrets::SecretStore;
use shuttle_service::error::CustomError;

async fn get_client(secret_store: &SecretStore) -> Result<Client, shuttle_service::Error> {
    let aws_ak = secret_store
        .get("AWS_ACCESS_KEY_ID")
        .ok_or_else(|| CustomError::msg("Could not find AWS access secrets"))?;
    let aws_sk = secret_store
        .get("AWS_SECRET_ACCESS_KEY")
        .ok_or_else(|| CustomError::msg("Could not find AWS access secrets"))?;

    let config = aws_config::from_env()
        .credentials_provider(Credentials::new(
            aws_ak,
            aws_sk,
            None,
            None,
            "ShuttleSecrets",
        ))
        .region("us-west-1")
        .load()
        .await;

    Ok(Client::new(&config))
}

pub async fn download_object(
    secret_store: &SecretStore,
    bucket: impl Into<String>,
    key: impl Into<String>,
) -> Result<GetObjectOutput, shuttle_service::Error> {
    Ok(get_client(secret_store)
        .await?
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .map_err(CustomError::new)?)
}
