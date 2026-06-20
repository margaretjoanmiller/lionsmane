package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	"codeberg.org/mjoanmiller/lionsmane/internal/auth"
	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/danielgtaylor/huma/v2/humacli"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/spf13/viper"

	gendb "codeberg.org/mjoanmiller/lionsmane/db"

	_ "github.com/danielgtaylor/huma/v2/formats/cbor"
)

// Options for the CLI.
type Options struct {
	Port int `help:"Port to listen on" short:"p" default:"8888"`
}

// GreetingOutput represents the greeting operation response.
type GreetingOutput struct {
	Body struct {
		Message string `json:"message" example:"Hello, world!" doc:"Greeting message"`
	}
}

func main() {
	ctx := context.Background()

	// grab config from environment variables and/or .env file
	viper.AutomaticEnv()
	viper.SetEnvPrefix("env")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.SetConfigFile(".env")

	err := viper.ReadInConfig()
	if err != nil {
		log.Fatalf("Error reading config file, %s", err)
	}

	// Connect to PostgreSQL
	pool, err := pgxpool.New(ctx, viper.GetString("POSTGRES_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	// Create the sqlc queries instance
	queries := gendb.New(pool)

	authService := auth.NewService(queries)
	// Create a CLI app which takes a port option.
	cli := humacli.New(func(hooks humacli.Hooks, options *Options) {
		// Create a new router & API
		router := chi.NewMux()

		router.Use(middleware.Logger)
		router.Use(middleware.CleanPath)

		// router.Use(zMiddle.New(authZ).RequireAuthorization())

		humaConf := huma.DefaultConfig("lionsmane", "1.0.0")

		humaConf.Components.SecuritySchemes = map[string]*huma.SecurityScheme{
			"apiKey": {
				Type:        "apiKey",
				In:          "header",
				Name:        "X-API-Key",
				Description: "API key for authenticating protected endpoints. Pass your key in the `X-API-Key` header.",
			},
			"bearer": {
				Type:         "http",
				Scheme:       "bearer",
				BearerFormat: "JWT",
			},
		}

		api := humachi.New(router, humaConf)

		type NewUserBody struct {
			Body struct {
				Email    string `json:"email" doc:"User email" format:"email"`
				Password string `json:"password" doc:"User password" minLength:"15"`
				Pfp      string `json:"pfp" doc:"User profile pic" format:"url"`
			}
		}

		huma.Register(api, huma.Operation{
			OperationID:   "signUp",
			Method:        http.MethodPost,
			Path:          "/auth/signup",
			Summary:       "Sign up for lionsmane",
			Tags:          []string{"Auth"},
			DefaultStatus: http.StatusCreated,
		}, func(ctx context.Context, input *NewUserBody) (*struct{}, error) {
			err := authService.CreateUser(ctx, &auth.NewUser{
				Email:    input.Body.Email,
				Password: input.Body.Password,
				Pfp:      input.Body.Pfp,
			})
			return nil, err
		})

		// Register GET /greeting/{name}
		huma.Register(api, huma.Operation{
			OperationID: "get-greeting",
			Method:      http.MethodGet,
			Path:        "/greeting/{name}",
			Summary:     "Get a greeting",
			Description: "Get a greeting for a person by name.",
			Tags:        []string{"Greetings"},
			Security: []map[string][]string{
				{
					"bearer": {"email"},
				},
			},
		}, func(ctx context.Context, input *struct {
			Name string `path:"name" maxLength:"30" example:"world" doc:"Name to greet"`
		},
		) (*GreetingOutput, error) {
			resp := &GreetingOutput{}
			resp.Body.Message = fmt.Sprintf("Hello, %s!", input.Name)
			return resp, nil
		})

		// Tell the CLI how to start your server.
		hooks.OnStart(func() {
			fmt.Printf("Starting server on port %d...\n", options.Port)
			http.ListenAndServe(fmt.Sprintf(":%d", options.Port), router)
		})
	})

	// Run the CLI. When passed no commands, it starts the server.
	cli.Run()
}
