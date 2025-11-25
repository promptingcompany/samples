#!/usr/bin/env bun

import Bun from "bun";
import { Kafka } from "kafkajs";

const cert = await Bun.file("ca-certificate.crt").text();
if (!cert) {
	throw new Error("Failed to read ca-certificate.crt");
}

const kafka = new Kafka({
	clientId: "test-connection",
	brokers: [
		process.env.KAFKA_BOOTSTRAP_SERVERS ||
			"your-kafka.db.ondigitalocean.com:25073",
	],
	sasl: {
		mechanism: "scram-sha-256",
		username: process.env.KAFKA_USERNAME || "doadmin",
		password: process.env.KAFKA_PASSWORD || "your-password",
	},
	ssl: {
		ca: [cert],
		rejectUnauthorized: true,
	},
});

async function testConnection() {
	console.log("🔌 Testing Kafka connection...");
	console.log("SASL mechanism: SCRAM-SHA-256\n");

	try {
		// Test admin connection
		const admin = kafka.admin();
		await admin.connect();
		console.log("✅ Admin client connected successfully!");

		// List topics
		const topics = await admin.listTopics();
		console.log(`\n📋 Found ${topics.length} topics:`);
		topics.forEach((topic) => console.log(`   - ${topic}`));

		// Get cluster info
		const cluster = await admin.describeCluster();
		console.log(`\n🖥️  Cluster info:`);
		console.log(`   Cluster ID: ${cluster.clusterId}`);
		console.log(`   Controller: ${cluster.controller}`);
		console.log(`   Brokers: ${cluster.brokers.length}`);

		await admin.disconnect();
		console.log("\n✅ Test completed successfully!");
	} catch (error) {
		console.error("\n❌ Connection failed:");
		if (error instanceof Error) {
			console.error(`   Error: ${error.message}`);
			if ("code" in error) {
				console.error(`   Code: ${error.code}`);
			}
		}
		console.error("\nFull error:", error);
		process.exit(1);
	}
}

testConnection();
