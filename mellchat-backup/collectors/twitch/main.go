package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/nicklaw5/helix/v2"
	"github.com/sirupsen/logrus"
)

const (
	TWITCH_CLIENT_ID     = "gp762nuuoqcoxypju8c569th9wz7q5"
	TWITCH_ACCESS_TOKEN  = "4bdy1fx0looodlsxildw6pekcj0fdc"
	TWITCH_REFRESH_TOKEN = "mdtk78avpyy7nyfntvjiaper0nw33to5ejd3cs8eqg93qrg3ue"
)

type TwitchCollector struct {
	client    *helix.Client
	redis     *redis.Client
	logger    *logrus.Logger
	ctx       context.Context
}

type Message struct {
	ID        string    `json:"id"`
	Platform  string    `json:"platform"`
	Channel   string    `json:"channel"`
	Username  string    `json:"username"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Category  string    `json:"category"`
	Upvotes   int       `json:"upvotes"`
}

func NewTwitchCollector() *TwitchCollector {
	// Twitch Helix client
	client, err := helix.NewClient(&helix.Options{
		ClientID:     TWITCH_CLIENT_ID,
		UserAccessToken: TWITCH_ACCESS_TOKEN,
	})
	if err != nil {
		log.Fatal("Failed to create Twitch client:", err)
	}

	// Redis connection
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})

	// Logger setup
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)
	logger.SetFormatter(&logrus.JSONFormatter{})

	return &TwitchCollector{
		client: client,
		redis:  rdb,
		logger: logger,
		ctx:    context.Background(),
	}
}

func (tc *TwitchCollector) Start() {
	tc.logger.Info("Starting Twitch Collector", map[string]interface{}{
		"client_id":     TWITCH_CLIENT_ID,
		"access_token":  TWITCH_ACCESS_TOKEN[:10] + "...",
		"refresh_token": TWITCH_REFRESH_TOKEN[:10] + "...",
	})

	// Test Redis connection
	_, err := tc.redis.Ping(tc.ctx).Result()
	if err != nil {
		tc.logger.Fatal("Failed to connect to Redis", map[string]interface{}{
			"error": err.Error(),
		})
	}

	tc.logger.Info("Connected to Redis successfully")

	// Test Twitch API
	err = tc.testTwitchAPI()
	if err != nil {
		tc.logger.Error("Twitch API test failed", map[string]interface{}{
			"error": err.Error(),
		})
	} else {
		tc.logger.Info("Twitch API test successful")
	}

	// Start collecting messages
	tc.collectMessages()
}

func (tc *TwitchCollector) testTwitchAPI() error {
	// Test API with a simple request
	resp, err := tc.client.GetUsers(&helix.UsersParams{})
	if err != nil {
		return err
	}

	if resp.StatusCode != 200 {
		return fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	tc.logger.Info("Twitch API test successful", map[string]interface{}{
		"status_code": resp.StatusCode,
		"users_count": len(resp.Data.Users),
	})

	return nil
}

func (tc *TwitchCollector) collectMessages() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			tc.processMessages()
		case <-tc.ctx.Done():
			tc.logger.Info("Twitch Collector stopped")
			return
		}
	}
}

func (tc *TwitchCollector) processMessages() {
	// Simulate message collection from Twitch chat
	message := Message{
		ID:        fmt.Sprintf("twitch_%d", time.Now().Unix()),
		Platform:  "twitch",
		Channel:   "test_channel",
		Username:  "test_user",
		Message:   "Test message from Twitch chat",
		Timestamp: time.Now(),
		Category:  "general",
		Upvotes:   0,
	}

	// Publish to Redis
	err := tc.redis.Publish(tc.ctx, "messages:twitch", message).Err()
	if err != nil {
		tc.logger.Error("Failed to publish message", map[string]interface{}{
			"error": err.Error(),
		})
		return
	}

	tc.logger.Info("Message published", map[string]interface{}{
		"platform": message.Platform,
		"channel":  message.Channel,
		"username": message.Username,
	})
}

func main() {
	collector := NewTwitchCollector()
	collector.Start()
}
