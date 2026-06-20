package auth

import (
	"context"
	"log/slog"
	"os"

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

func (s *Service) CreateUser(ctx context.Context, user *NewUser) error {
	p := &params{
		memory:      64 * 1024,
		iterations:  3,
		parallelism: 2,
		saltLength:  16,
		keyLength:   32,
	}
	hash, hashErr := generateFromPassword(user.Password, p)

	if hashErr != nil {
		os.Exit(1)
	}

	err := s.r.CreateUser(ctx, db.CreateUserParams{
		Email:    user.Email,
		Hashpass: hash,
		Pfp:      pgtype.Text{String: user.Pfp},
	})
	if err != nil {
		slog.Error("Error creating new user")
		return err
	}
	return nil
}
