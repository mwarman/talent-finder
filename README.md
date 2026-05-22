# Talent Finder

Talent Finder is a full-stack, AI-powered portfolio project that ingests a corpus of resume, CV, and professional
profile documents into an AWS Bedrock Knowledge Base and exposes a conversational search interface for querying
candidates by skill, experience, and inferred seniority.

## About

Talent Finder is a full-stack, AI-powered application that ingests a corpus of resume, CV, and professional profile documents into an AWS Bedrock Knowledge Base and exposes a conversational search interface for querying candidates by skill, experience, and inferred seniority. Users upload PDF or TXT documents through a React-based management UI, triggering an S3-backed ingestion pipeline that chunks, embeds, and indexes content into a Pinecone Serverless vector store via Bedrock Knowledge Bases. Queries are handled via a Retrieve-then-Generate pattern — Bedrock retrieves relevant chunks, a prompt-engineered Lambda constructs a grounded reasoning request, and Claude Sonnet 4.6 generates cited, inference-aware responses. Talent Finder is the third installment in a portfolio trilogy (resume-lens → career-compass → Talent Finder), completing a coherent narrative spanning structured extraction, conversational coaching, and corpus-scale semantic retrieval. See the [Project Overview](./docs/PROJECT_OVERVIEW.md) for additional details.

## Getting Started

## Available Scripts

## Documentation

The project documentation (`docs/`) is the source for all detailed project information such as: Architecture, Technologies,
DevOps, Configuration, etc.

- [**TABLE OF CONTENTS**](docs/README.md) - The table of contents for all project documentation.

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

## Author

**Matt Warman** — Portfolio project  
GitHub: [@mwarman](https://github.com/mwarman)  
Related: [resume-lens](https://github.com/mwarman/resume-lens), [career-compass](https://github.com/mwarman/resume-lens)
