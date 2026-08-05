package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"trialvo.dev/license-agent/internal/client"
	"trialvo.dev/license-agent/internal/gate"
	"trialvo.dev/license-agent/internal/lease"
)

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func main() {
	cpURL := env("CONTROL_PLANE_URL", "")
	installID := env("TRIAL_INSTALL_ID", "")
	secret := env("TRIAL_AGENT_SECRET", "")
	bootstrap := env("TRIAL_BOOTSTRAP_TOKEN", "")
	domain := env("TRIAL_DOMAIN", "")
	agentPort := env("AGENT_PORT", "9099")
	version := env("AGENT_VERSION", "go-agent-1.0")

	if cpURL == "" || installID == "" || secret == "" {
		log.Fatal("CONTROL_PLANE_URL, TRIAL_INSTALL_ID, TRIAL_AGENT_SECRET required")
	}

	c := client.New(cpURL, installID, secret, bootstrap, version)
	store := lease.NewStore(env("LEASE_CACHE_PATH", "/agent/lease.jwt"))
	g := gate.New(store, agentPort)

	// Register so the Control Plane records this install as live.
	if err := c.Register(domain); err != nil {
		log.Printf("register warning: %v", err)
	}

	go g.Serve()

	// ARCHITECTURE: this Go sidecar is a lightweight, independent lease GATE
	// only. Remote command execution (backup/restore/freeze/destroy) is owned by
	// the in-container Node license client, which is the one process that can
	// actually run mysqldump and touch the app's uploads volume.
	//
	// Crucially, the agent must NOT call /heartbeat here: on the Control Plane,
	// the heartbeat response is the command-delivery channel and marks pending
	// commands as "sent". If both this sidecar and the Node client polled it,
	// whichever won the race would consume a command the other could not
	// execute (e.g. the sidecar acking backup_now without dumping anything),
	// silently dropping the real operation. So we only refresh the lease and let
	// the gate reflect active/frozen; the Node client owns heartbeat + commands.
	// Align with Node lease cadence (~30m); 15m keeps gate fresh without duplicate storm.
	tickerLease := time.NewTicker(15 * time.Minute)
	defer tickerLease.Stop()

	refresh := func() {
		tok, state, err := c.FetchLease(domain)
		if err != nil {
			log.Printf("lease: %v", err)
			return
		}
		if state == "frozen" || tok == "" {
			store.Clear()
			return
		}
		store.Set(tok)
	}

	refresh()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	for {
		select {
		case <-tickerLease.C:
			refresh()
		case <-sig:
			log.Println("license-agent shutting down")
			return
		}
	}
}
