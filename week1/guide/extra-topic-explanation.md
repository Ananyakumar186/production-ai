# React - JS/ TS frontend framework
1. **Component-based**: Reusable components (Building blocks with markup, styles logic)
2. **Declarative**: Describe UI gien state (React efficiently updates the DOM with any changes)
3. **Props & State**: Get props, manage state (When either change, React re-renders the component and components it contains)
4. **JSX/TSX**: Convenient format (Belnds HTML and JS/TS in a simple, easy-to-read way to increase productivity)
5. **Ecosystem**: Incredibly Rich (Forms, Routing, UI component libraries like Material UI, Chakra UI)

# NextJS from vercel

- This is the framework built on top of React
- Includes 2 approaches for Routing requests for pages:
    - Pages router (pages/) is simpler, trusted, very common.
    - App Router (app/) is newer, more powerful.
- Pages can be rendered client-side or server-side.
- Includes built-in tooling to transpile & bundle.

# Python Backend Frameworks

- **Django**: Heavyweight, "batteries included" framework ORM, authentication, templating, admin interface.
- **Flask**: Micro-framework - routing and request handling, Lightweight and quick to start, but requires add-ons.
- **FastAPI**: Modern, async, built on Starlette and Pydantic, Optimized for APIs


# AWS 

## IAM

IAM - Identity Access Management

- Granular security is one of AWS's strengths (Super tiresome and painful, but for good reason)
- We will start by creating a Root User (Only used for assigning permission & budgeting)
- Then we will create our "IAM User" (Called aiengineer - we will be our workhorse for the course)

## AWS services used

- **App runner**: Deploy containers (Simplest AWS way to deploy containerized web applications)
- **ECR Elastic Container Registry**: Registry (Like github but for container on AWS)
- **CloudWatch**: Monitoring (Collects logs from all your AWS services)

## Cloud Deployment Archetypes

- **Traditional Cloud Servers - IaaS**: Where evrything started; rent a server and install everything Eg: EC2 (AWS), Terraform
- **Platform as a Service - PaaS**: Just bring you code; the deployment is handled for you. Eg: Vercel Beanstalk
- **Container as a Service - Caas**: You provide an app in a container; the service takes care of the rest. Eg: App Runner (AWS)
- **Container Orchestration**: Run your own fleet of containers and manage how they scale. Eg: ECS, EKS (AWS)
- **Serverless Functions - FaaS**: Upload individual tiny functions and pay per request. Eg: Lambda

## AWS BIOLOGY

### Components

- **Amazon S3: Simple Storage Service**: Like a shared drive in the cloud, organized in "buckets", this is where the build file is uploaded, and memory management for api to handle history.
- **Aws Lambda**: Individual functions on the cloud, to add the backend code to run, pay for CPU time.
- **Amazon CloudFront**: A content delivery network (CDN) for quickly serving static content.
- **Amazon API Gateway**: Create , manage and scale APIs and handle their routes.
- **Amazon Bedrock**: Quickly build Gen AI applications by connecting to LLMs
- **AWS Resource Explorer**: Used to check the overall resouce allocation or services used for a website or project.

## AWS Terraform

- **Controlled: Checked into Git**: .tf files with your configuration (Not checked in state files that map configuration to resources).

- **Automated: Configures Everything**: No more AWS console! Everything we did is automated (except IAM).

- **Repeatable: Destroy & Recreate**: terraform init - stands up your entire environment terraform destroy -deletes.

- **AWS CDK** is Amazon's proprietary version.

### Terminology

- **Provider**: A vendor like AWS (A plugin to make Terraform apply to that provider).

- **Variable**: Parameters (Configurable settings that affect your deployment).

- **Resource**: The building block (Each AWS service to be created is described with a resource).

- **State**: Record of resources (Maps the configuration to actual resources).

- **Output**: Results of deployment (Like actual CloudFront distribution URLs).

- **Workspaces**: Separated State (Isolated state for the same configuration).

# Docker

- A box within your box (A lightweight alternative to VMs that shares the host's OS)
- Isolated, portable (Run the same software everywhere)

- **DockerFile**: Recipe (A text file with instructions for installing & configuring)
- **Image**: Snapshot (Created by building a Dockerfile and ready to be made live)
- **Container**: A live instance (A running isolated environment created from an image)

# Github Actions

- **Actions**: Platform (Run scripts in response to actions like doing a git push).
- **Workflows**: Orchestration (YAML files stored in github/workflows).
- **Jobs**: Execution (Collection of steps that run on a 'Runner' VM). 