# Deployment

## Student-friendly Firebase path

1. Create a Firebase project and enable Email/Password Authentication.
2. Create Firestore and a private Cloud Storage bucket.
3. Add a Firebase client config to frontend environment variables.
4. Deploy the frontend with `firebase deploy --only hosting`.
5. Run the backend on Cloud Run or another student-friendly container host with the same `/api` contract.
6. Add Firebase Admin credentials through the host secret manager, never Git.
7. Add Functions for late processing, analytics, and asynchronous file scanning.

## Provider mapping

AWS: Firebase Hosting → S3/CloudFront, backend → App Runner/Lambda, API → API Gateway, Firestore → DynamoDB/RDS, Storage → S3, Auth → Cognito, logs → CloudWatch.

Azure: Static Web Apps, Container Apps/Functions, API Management, Cosmos DB, Blob Storage, Entra External ID, Application Insights.

GCP: Firebase Hosting, Cloud Run, API Gateway, Firestore, Cloud Storage, Firebase Auth, Cloud Functions, Cloud Logging.