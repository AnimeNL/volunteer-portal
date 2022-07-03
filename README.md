AnimeCon 2022 Volunteer Portal (frontend)
===
This repository contains a Volunteer Portal frontend implementation for the [AnimeCon 2022](https://www.animecon.nl/) festival. The backend may be found in the [volunteer-portal-api](https://github.com/AnimeNL/volunteer-portal-api) project, also published on GitHub.

**This project has been designed to be applicable to other conferences as well. Fork this repository, provide an implementation of [the API](API.md) and replace the resources in [static/](static/) as you see fit. Contributions are most welcomed, even when they are not immediately applicable to AnimeCon.**

![Dependencies](https://img.shields.io/depfu/dependencies/github/AnimeNL/volunteer-portal) ![Issues](https://img.shields.io/github/issues/AnimeNL/volunteer-portal)

## Volunteer Portal
The Volunteer Portal is a frontend project that allows

  * [MUI](https://mui.com/)
  * [Preact](https://preactjs.com/)
  * [TypeScript](https://www.typescriptlang.org/)
  * [webpack](https://webpack.js.org/)

### APIs
The volunteer portal interacts with a server endpoint through a [defined API](src/api/), which it assumes runs on the same origin as the frontend. This can be overridden by setting the `REACT_APP_API_HOST` environment variable to another origin just before invoking webpack. The endpoint paths are defined in [ApiRequest.ts](src/base/ApiRequest.ts), and are not intended to be configurable.

The [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator) library is used for converting the TypeScript API definitions to a JSON scheme, for which we've written a [small, manual validator](src/base/ApiValidator.ts) used responses from the server endpoint.

### Base
The [base library](src/base/) provides the majority of the volunteer portal's business logic. Code in this directory cannot participate in constructing the (Preact) DOM. Furthermore, code in this directory is expected to be tested. TypeScript interfaces are used to hide internal implementation details from API consumers, although this is not a strict requirement.

### Welcome App
The [Welcome App](src/welcome/) is the overview page that should be shown when a visitor loads the volunteer portal for the first time. The intention of this app is to provide convenient access to either apply to participate in an event, or access their schedule for an event.

Visibility of events in the Welcome App is defined by the API endpoint. Administrator users receive additional visibility, wherein options made available through privilege are clearly highlighted.

### Registration App
The [Registration App](src/registration/) is where volunteers can find additional information about a particular event, and, when enabled, apply to participate in it. Content for an event's registration environment is to be provided by the API endpoint.

Both the ability to apply and the ability to display progression of an application are reliant on the [User](src/base/User.ts) functionality, and the volunteer having identified to their account. This, too, is controled by the API endpoint.

### Schedule App
The [Schedule App](src/schedule/) is where volunteers can find their schedules for a particular event. It's a reasonably powerful and complex app that further displays the event's entire programme, participating volunteers, and enables a volunteer to quickly search through both.

### Display App
The [Display App](src/display/) is an interface specifically built for the physical Volunteering Location Screens, which are based on 7" Raspberry Pi touch interfaces at a very particular resolution. Access to the displayed content is only available with a specific display identifier.
