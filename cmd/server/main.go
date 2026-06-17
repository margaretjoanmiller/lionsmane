package main

import (
	"context"
	"fmt"
	"html/template"
	"net/http"
	"sort"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/danielgtaylor/huma/v2/humacli"
	"github.com/go-chi/chi/v5"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/discord"
	"github.com/markbates/goth/providers/google"
	"github.com/markbates/goth/providers/openidConnect"
	"github.com/spf13/viper"

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

type ProviderIndex struct {
	Providers    []string
	ProvidersMap map[string]string
}

func main() {
	viper.AutomaticEnv()
	viper.SetEnvPrefix("env")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// viper.SetConfigName("config")
	// viper.SetConfigType("toml") // Config file type
	// viper.AddConfigPath(".")
	//
	// err := viper.ReadInConfig()
	// if err != nil {
	// 	log.Fatalf("Error reading config file, %s", err)
	// }

	// Create a CLI app which takes a port option.
	cli := humacli.New(func(hooks humacli.Hooks, options *Options) {
		// Create a new router & API
		router := chi.NewMux()
		api := humachi.New(router, huma.DefaultConfig("My API", "1.0.0"))

		goth.UseProviders(
			google.New(viper.GetString("GOOGLE_KEY"), viper.GetString("GOOGLE_SECRET"), "http://localhost:3000/auth/google/callback"),
			discord.New(viper.GetString("DISCORD_KEY"), viper.GetString("DISCORD_SECRET"), "http://localhost:3000/auth/discord/callback"),
		)

		// OpenID Connect is based on OpenID Connect Auto Discovery URL (https://openid.net/specs/openid-connect-discovery-1_0-17.html)
		// because the OpenID Connect provider initialize itself in the New(), it can return an error which should be handled or ignored
		// ignore the error for now
		openidConnect, _ := openidConnect.New(viper.GetString("OPENID_CONNECT_KEY"), viper.GetString("OPENID_CONNECT_SECRET"), "http://localhost:3000/auth/openid-connect/callback", viper.GetString("OPENID_CONNECT_DISCOVERY_URL"))
		if openidConnect != nil {
			goth.UseProviders(openidConnect)
		}

		m := map[string]string{
			"discord":        "Discord",
			"google":         "Google",
			"openid-connect": "OpenID Connect",
		}

		var keys []string
		for k := range m {
			keys = append(keys, k)
		}
		sort.Strings(keys)

		providerIndex := &ProviderIndex{Providers: keys, ProvidersMap: m}

		router.Get("/auth/{provider}/callback", func(res http.ResponseWriter, req *http.Request) {
			user, err := gothic.CompleteUserAuth(res, req)
			if err != nil {
				fmt.Fprintln(res, err)
				return
			}
			t, _ := template.New("foo").Parse(userTemplate)
			t.Execute(res, user)
		})

		router.Get("/logout/{provider}", func(res http.ResponseWriter, req *http.Request) {
			gothic.Logout(res, req)
			res.Header().Set("Location", "/")
			res.WriteHeader(http.StatusTemporaryRedirect)
		})

		router.Get("/auth/{provider}", func(res http.ResponseWriter, req *http.Request) {
			// try to get the user without re-authenticating
			if gothUser, err := gothic.CompleteUserAuth(res, req); err == nil {
				t, _ := template.New("foo").Parse(userTemplate)
				t.Execute(res, gothUser)
			} else {
				gothic.BeginAuthHandler(res, req)
			}
		})

		router.Get("/", func(res http.ResponseWriter, req *http.Request) {
			t, _ := template.New("foo").Parse(indexTemplate)
			t.Execute(res, providerIndex)
		})

		// Register GET /greeting/{name}
		huma.Register(api, huma.Operation{
			OperationID: "get-greeting",
			Method:      http.MethodGet,
			Path:        "/greeting/{name}",
			Summary:     "Get a greeting",
			Description: "Get a greeting for a person by name.",
			Tags:        []string{"Greetings"},
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

var indexTemplate = `{{range $key,$value:=.Providers}}
    <p><a href="/auth/{{$value}}">Log in with {{index $.ProvidersMap $value}}</a></p>
{{end}}`

var userTemplate = `
<p><a href="/logout/{{.Provider}}">logout</a></p>
<p>Name: {{.Name}} [{{.LastName}}, {{.FirstName}}]</p>
<p>Email: {{.Email}}</p>
<p>NickName: {{.NickName}}</p>
<p>Location: {{.Location}}</p>
<p>AvatarURL: {{.AvatarURL}} <img src="{{.AvatarURL}}"></p>
<p>Description: {{.Description}}</p>
<p>UserID: {{.UserID}}</p>
<p>AccessToken: {{.AccessToken}}</p>
<p>ExpiresAt: {{.ExpiresAt}}</p>
<p>RefreshToken: {{.RefreshToken}}</p>
`
