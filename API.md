# API Documentation
The volunteer portal requires a number of API calls in order to work properly. They can be provided
by any back-end, as long as the returned data matches the specification below. Both request and
response structures must be given as JSON.

## /api/environment

### Request
A `GET` request with no additional payload.

### Response (`IEnvironmentResponse`)
| Property         | Type      | Description |
| :---             | :---      | :--- |
| `contactName`    | `string`  | Name of the person who can be contacted for questions. |
| `contactTarget`  | `string?` | Link target (phone number / e-mail address) of the person who can be contacted for questions. |
| `events`         | `IEnvironmentResponseEvent[]` | Array of the events that are supported by this portal. |
| `title`          | `string`  | Name of the Volunteer Portal instance, e.g. _Volunteer Portal_. |

### Response (`IEnvironmentResponseEvent`)
| Property             | Type      | Description |
| :---                 | :---      | :--- |
| `name`               | `string`  | Name of the event, e.g. _PortalCon 2021_. |
| `enablePortal`       | `boolean` | Whether the portal should be enabled for registered volunteers. |
| `enableRegistration` | `boolean` | Whether volunteer registrations should be accepted. |
| `slug`               | `string`  | URL-safe representation of the event's name, e.g. _portalcon-2021_. |
| `timezone`           | `string`  | Timezone in which the event takes place, e.g. _Europe/London_. |
| `website`            | `string?` | URL to the website of the broader event. |
