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


# AWS - IAM

IAM - Identity Access Management

- Granular security is one of AWS's strengths (Super tiresome and painful, but for good reason)
- We will start by creating a Root User (Only used for assigning permission & budgeting)
- Then we will create our "IAM User" (Called aiengineer - we will be our workhorse for the course)

## AWS services used

- **App runner**: Deploy containers (Simplest AWS way to deploy containerized web applications)
- **ECR Elastic Container Registry**: Registry (Like github but for container on AWS)
- **CloudWatch**: Monitoring (Collects logs from all your AWS services)

# Docker

- A box within your box (A lightweight alternative to VMs that shares the host's OS)
- Isolated, portable (Run the same software everywhere)

- **DockerFile**: Recipe (A text file with instructions for installing & configuring)
- **Image**: Snapshot (Created by building a Dockerfile and ready to be made live)
- **Container**: A live instance (A running isolated environment created from an image)