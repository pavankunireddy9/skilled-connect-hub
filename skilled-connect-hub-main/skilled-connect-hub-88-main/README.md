# ShramSetu

ShramSetu — Complete app explanation

ShramSetu is a digital platform that connects skilled labour cooperative societies and independent workers with households and institutions that need their services. It helps workers find jobs, manage bookings, and earn income while allowing cooperative organizations to manage their members and service operations.

1. The real-world problem

Imagine a customer needs a plumber to fix a leaking tap. They need to find a reliable worker, check their skills, know their availability, and arrange the service.

At the same time, a skilled plumber who belongs to a labour cooperative may be available but have no easy way to find customers. The cooperative might manage workers through phone calls, notebooks, or informal communication.

The same problem affects electricians, carpenters, painters, drivers, cleaners, gardeners, caregivers, and other skilled workers.

ShramSetu solves this by creating a structured digital connection between the people who provide services and the people who need them.

2. Who uses the app?

Customers

Service seekers

Households and institutions that need a service. They browse workers, request services, and track bookings.

Independent workers

Service providers

Skilled individuals who register on their own, maintain their profiles, and accept and complete jobs independently.

Cooperative administrators

Organization managers

Authorized cooperative managers who register the society, verify members, manage service requests, and coordinate workers.

3. How the app works

01

A worker joins

A plumber, electrician, or other skilled worker registers as an independent provider or joins a labour cooperative through its authorized administrator.

02

The worker gets verified

The platform collects the worker's identity, skills, experience, and relevant documents. A cooperative administrator or authorized reviewer verifies the details.

03

The worker becomes available

The worker publishes a service profile with skills, service area, pricing or quote preferences, and availability.

04

A customer requests a service

The customer searches for a service, views suitable providers, and submits a booking request with the work details, location, and preferred time.

05

The worker accepts and completes the job

The provider reviews the request, accepts or declines it, performs the service, and updates the booking status. The customer can confirm completion and provide a review.

4. What we are building inside the Service Provider interface

This is the part we are designing now. The worker should be able to manage their entire working life from one dashboard.

Worker dashboard

Shows today's jobs, pending requests, earnings, ratings, and important notifications.

My services and profile

Manage profile photo, skills, experience, service categories, pricing, work portfolio, and verification status.

Bookings and jobs

View new requests, upcoming work, active jobs, completed jobs, and cancellations. Open each booking for customer details and job instructions.

Availability and service area

Set working days, time slots, areas served, and whether the provider is currently accepting jobs.

Earnings and reviews

Track completed service income, payment status, customer ratings, and performance history.

5. How the cooperative works inside the app

A labour cooperative is an organization owned and governed by its members. ShramSetu does not need to own the workers or replace the cooperative.

The cooperative administrator creates and manages the organization's digital presence. They can add members, verify their skills, organize service categories, and handle requests that come through the cooperative.

For example, a cooperative has 20 electricians, 15 plumbers, and 10 carpenters. When a customer requests plumbing work, the administrator can assign the job to a suitable available plumber, or the platform can route the request to an eligible member based on the cooperative's rules.

The exact assignment rules, membership approval, and payment-sharing policies are decisions we must define for the first version.

6. What makes ShramSetu different?

Cooperative-first: Gives labour societies a structured digital system to manage their skilled workforce.

Independent worker support: Allows skilled workers to join without needing to belong to a cooperative.

Trust and transparency: Verification, service history, ratings, and clear booking statuses help build customer confidence.

Better access to work: Makes skilled workers more discoverable and gives cooperatives a way to coordinate opportunities.

7. The complete app structure

ShramSetu

One platform • Three user experiences

Customer app

Search services, book workers, track jobs.

Service provider

Manage profile, requests, jobs, and earnings.

Cooperative administrator

Manage the organization, members, verification, service requests, and assignments.

In one sentence: ShramSetu is a digital bridge between skilled workers and service seekers, with dedicated tools for independent providers and cooperative organizations to manage work, build trust, and create better earning opportunities.. I WANT ONLY UI

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://skilled-connect-hub-88.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4c5e1b4d-2491-48d5-a8ba-7d453309c5d2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
