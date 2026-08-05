package client

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"
)

type Client struct {
	BaseURL    string
	InstallID  string
	Secret     string
	Bootstrap  string
	Version    string
	HTTPClient *http.Client
}

type Command struct {
	ID      string         `json:"id"`
	Command string         `json:"command"`
	Payload map[string]any `json:"payload"`
}

func New(base, installID, secret, bootstrap, version string) *Client {
	return &Client{
		BaseURL:    stringsTrimRight(base, "/"),
		InstallID:  installID,
		Secret:     secret,
		Bootstrap:  bootstrap,
		Version:    version,
		HTTPClient: &http.Client{Timeout: 60 * time.Second},
	}
}

func stringsTrimRight(s, cutset string) string {
	for len(s) > 0 && s[len(s)-1:] == cutset {
		s = s[:len(s)-1]
	}
	return s
}

func (c *Client) sign(body []byte) (map[string]string, error) {
	ts := strconv.FormatInt(time.Now().UnixMilli(), 10)
	sum := sha256.Sum256(body)
	msg := c.InstallID + "." + ts + "." + hex.EncodeToString(sum[:])
	mac := hmac.New(sha256.New, []byte(c.Secret))
	mac.Write([]byte(msg))
	return map[string]string{
		"X-Install-Id": c.InstallID,
		"X-Timestamp":  ts,
		"X-Signature":  hex.EncodeToString(mac.Sum(nil)),
		"Content-Type": "application/json",
	}, nil
}

func (c *Client) Register(domain string) error {
	body, _ := json.Marshal(map[string]any{
		"installId":      c.InstallID,
		"domain":         domain,
		"agentVersion":   c.Version,
		"productVersion": "lifestyle",
	})
	req, err := http.NewRequest("POST", c.BaseURL+"/api/agent/register", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.Bootstrap)
	req.Header.Set("Content-Type", "application/json")
	res, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return fmt.Errorf("register %d: %s", res.StatusCode, string(b))
	}
	return nil
}

func (c *Client) FetchLease(domain string) (token string, state string, err error) {
	payload := map[string]any{"installId": c.InstallID, "domain": domain}
	body, _ := json.Marshal(payload)
	headers, err := c.sign(body)
	if err != nil {
		return "", "", err
	}
	req, err := http.NewRequest("POST", c.BaseURL+"/api/agent/lease", bytes.NewReader(body))
	if err != nil {
		return "", "", err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	res, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer res.Body.Close()
	var out struct {
		State string `json:"state"`
		Lease string `json:"lease"`
	}
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return "", "", err
	}
	return out.Lease, out.State, nil
}

func (c *Client) Heartbeat(frozen bool) ([]Command, error) {
	status := "running"
	local := "active"
	if frozen {
		status = "frozen"
		local = "frozen"
	}
	payload := map[string]any{
		"installId":    c.InstallID,
		"status":       status,
		"localState":   local,
		"agentVersion": c.Version,
	}
	body, _ := json.Marshal(payload)
	headers, _ := c.sign(body)
	req, err := http.NewRequest("POST", c.BaseURL+"/api/agent/heartbeat", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	res, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	var out struct {
		Commands []Command `json:"commands"`
	}
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out.Commands, nil
}

func (c *Client) Ack(cmdID, status string, result any) error {
	payload := map[string]any{
		"installId": c.InstallID,
		"status":    status,
		"result":    result,
	}
	body, _ := json.Marshal(payload)
	headers, _ := c.sign(body)
	req, err := http.NewRequest("POST", c.BaseURL+"/api/agent/commands/"+cmdID+"/ack", bytes.NewReader(body))
	if err != nil {
		return err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	res, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	return nil
}
