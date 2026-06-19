package auth

import (
	"context"
	"log/slog"

	"codeberg.org/mjoanmiller/lionsmane/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service struct {
	r *db.Queries
}

func NewService(r *db.Queries) *Service {
	return &Service{
		r: r,
	}
}

type NewUser struct {
	Email    string `json:"email" doc:"User email" format: "email"`
	Password string `json:"password" doc:"User password" minLength:"15"`
	Pfp      string `json:"pfp" doc:"User profile pic" format: "url"`
}

func (s *Service) CreateUser(ctx context.Context, user NewUser) error {
	err := s.r.CreateUser(ctx, db.CreateUserParams{
		user.Email,
		user.Password,
		pgtype.Text{String: user.Pfp},
	})
	if err != nil {
		slog.Error("Error creating new user")
		return err
	}
	return nil
}
