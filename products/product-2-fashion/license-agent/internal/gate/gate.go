package gate

import (
	"encoding/json"
	"log"
	"net/http"

	"trialvo.dev/license-agent/internal/lease"
)

type Server struct {
	store *lease.Store
	addr  string
}

func New(store *lease.Store, port string) *Server {
	// Bind all interfaces (not just loopback): in the Option 2 stack the API
	// runs in a separate container and reaches this gate over the compose network
	// at http://license-agent:<port>. A 127.0.0.1-only bind would refuse those
	// cross-container connections. The gate is only exposed inside the private
	// compose network (no host port publish), so this is not internet-facing.
	return &Server{store: store, addr: ":" + port}
}

func (s *Server) Serve() {
	mux := http.NewServeMux()
	mux.HandleFunc("/gate", func(w http.ResponseWriter, r *http.Request) {
		tok := s.store.Get()
		w.Header().Set("Content-Type", "application/json")
		if tok == "" {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"ok":    false,
				"lease": nil,
				"state": "frozen",
			})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":    true,
			"lease": tok,
			"state": "active",
		})
	})
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		_, _ = w.Write([]byte("ok"))
	})
	log.Printf("license-agent gate listening on %s", s.addr)
	if err := http.ListenAndServe(s.addr, mux); err != nil {
		log.Printf("gate server: %v", err)
	}
}
