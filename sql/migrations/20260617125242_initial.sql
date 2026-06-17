-- +goose Up
CREATE TABLE IF NOT EXISTS Users (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    sub VARCHAR UNIQUE,
    dateCreated TIMESTAMPTZ
);

-- +goose Down
DROP TABLE Users;
