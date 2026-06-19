-- name: GetUser :one
SELECT (id, email, created_at, hashpass) FROM users
WHERE id = $1 LIMIT 1;

-- name: CreateUser :exec
INSERT INTO users (email, hashpass, pfp, created_at) VALUES ($1, $2, $3, now());
