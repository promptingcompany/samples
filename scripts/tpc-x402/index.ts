import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";

// Create signer
const signer = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

// Create x402 client and register EVM scheme
const client = new x402Client();
registerExactEvmScheme(client, { signer });

// Wrap fetch with payment handling
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Make request - payment is handled automatically
const response = await fetchWithPayment(
	// `https://app.promptingco.com/api/v1/x402/llms.txt?url=${encodeURIComponent("https://promptingcompany.com")}`,
	`http://localhost:3000/api/v1/x402/llms.txt?url=${encodeURIComponent("https://promptingcompany.com")}`,
	{
		method: "GET",
	},
);

const data = await response.json();
console.log("Response:", data);

// Get payment receipt from response headers
if (response.ok) {
	const httpClient = new x402HTTPClient(client);
	const paymentResponse = httpClient.getPaymentSettleResponse((name) =>
		response.headers.get(name),
	);
	console.log("Payment settled:", paymentResponse);
}
