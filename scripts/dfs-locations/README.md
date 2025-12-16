# dfs-locations

A simple Bun script to fetch and analyze the most popular locations from the DataForSEO AI Optimization API.

## Setup

1. Get your DataForSEO API credentials from https://app.dataforseo.com/api-access

2. Create a `.env` file:
```bash
DATAFORSEO_USERNAME=your_username
DATAFORSEO_PASSWORD=your_password
```

3. Install dependencies:
```bash
bun install
```

## Usage

```bash
bun start
```

Or directly with dotenvx:
```bash
dotenvx run -- bun run index.ts
```

This will:
- Fetch all available locations from the DataForSEO AI Keyword Data API
- Display the top 20 locations by language support (as a popularity indicator)
- Show details for major locations like United States, United Kingdom, etc.
- Display the API cost (this endpoint is free)

## API Documentation

This script uses the DataForSEO locations and languages endpoint:
https://docs.dataforseo.com/v3/ai_optimization/ai_keyword_data/locations_and_languages/

This project was created using `bun init` in bun v1.3.0. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
