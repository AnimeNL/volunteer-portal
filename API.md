# API Documentation
The volunteer portal requires a number of API calls in order to work properly. They can be provided
by any back-end, as long as the returned data matches the specification below. Both request and
response structures must be given as JSON.

## /api/auth
Allows an authentication token (`authToken`) to be obtained for given credentials. The token may
have an expiration time, which should be validated on both the client and server-side.

### Request (`IAuthRequest`)
A `POST` request containing the following HTML form encoded fields.

| Property         | Type     | Description |
| :---             | :---     | :--- |
| `emailAddress`   | `string` | The e-mail address associated to authenticate with. |
| `accessCode`     | `string` | Access code given to the person who owns this e-mail address. |

### Response (`IAuthResponse`)
| Property  | Type      | Description |
| :---      | :---      | :---        |
| `authToken`           | `string?`   | Unique token which can be used to fetch protected content. Omitted on failure. |
| `authTokenExpiration` | `number?`   | Time at which the authentication token expires. Indicated as a UNIX timestamp in UTC. |

## /api/content
Allows static content to be obtained for the registration sub-application, as well as other pages
that can be displayed on the portal. The `<App>` component is responsible for routing these.

### Request
A `GET` request with no additional payload.

### Response (`IContentResponse`)
| Property         | Type      | Description |
| :---             | :---      | :--- |
| `pages`          | `IContentResponsePage[]` | Array of the pages that are available as plain content. |

### Response (`IContentResponsePage`)
| Property         | Type      | Description |
| :---             | :---      | :--- |
| `pathname`       | `string` | Full pathname through which this content can be identified. |
| `content`        | `string` | Contents of the page. May contain [Markdown syntax](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet). |
| `modified`       | `number` | Last modification time of the page. Indicated as a UNIX timestamp in UTC. |

  * **Note**: Where there are duplicated `pathname` values, the last one will be used.
  * **Note**: Directories represented as pages should have an index. If `/foo/bar.html` is a thing, then so should `/foo/` be.

## /api/environment
Allows information to be obtained for the environment the volunteer portal runs under. This allows
multiple events to be managed by the same instance without needing to change the frontend.

### Request
A `GET` request with no additional payload.

### Response (`IEnvironmentResponse`)
| Property         | Type      | Description |
| :---             | :---      | :--- |
| `title`          | `string`  | Name of the Volunteer Portal instance, e.g. _Volunteer Portal_. |
| `themeColor`     | `string`  | Colour (in #RRGGBB format) that should define the portal's theme. |
| `events`         | `IEnvironmentResponseEvent[]` | Array of the events that are supported by this portal. |
| `contactName`    | `string`  | Name of the person who can be contacted for questions. |
| `contactTarget`  | `string?` | Link target (phone number / e-mail address) of the person who can be contacted for questions. |

### Response (`IEnvironmentResponseEvent`)
| Property             | Type      | Description |
| :---                 | :---      | :--- |
| `name`               | `string`  | Name of the event, e.g. _PortalCon 2021_. |
| `enableContent`      | `boolean` | Whether content pages for this event should be enabled. |
| `enableRegistration` | `boolean` | Whether volunteer registrations should be accepted for this event. |
| `enableSchedule`     | `boolean` | Whether access to the schedule should be enabled for this event. |
| `identifier`         | `string`  | URL-safe representation of the event's name, e.g. _portalcon-2021_. |
| `timezone`           | `string`  | Timezone in which the event takes place, e.g. _Europe/London_. |
| `website`            | `string?` | URL to the website of the broader event. |

## /api/event
Allows full scheduling information to be requested about a particular event, indicated by the `event` request parameter. The returned data is expected to have been (pre)filtered based on the access level granted to the owner of the given `authToken`.

### Request
A `GET` request with the `authToken` and `event` identifier specified as request parameters.

### Response
| Property        | Type                        | Description |
| :---            | :---                        | :---        |
| `events`        | `IEventResponseEvent[]`     | Array of events that will be taking place during this event. |
| `locations`     | `IEventResponseLocation[]`  | Array of locations that exist for this event. |
| `volunteers`    | `IEventResponseVolunteer[]` | Array of volunteers that can be assigned shifts during this event. |

### Response (`IEventResponseEvent`)
| Property        | Type                      | Description |
| :---            | :---                      | :---        |
| `title`         | `string`                  | Visitor-visible name summarising the event. |
| `description`   | `string`                  | Short (1–3 sentence) description briefly summarising the event. |
| `sessions`      | `IEventResponseSession[]` | Sessions associated with this particular event. |

### Response (`IEventResponseLocation`)
| Property        | Type                 | Description |
| :---            | :---                 | :---        |
| `name`          | `string`             | Name of the location. |
| `area`          | `string`             | Area in which the location is located. Could be a floor, or a section of the building. |

### Response (`IEventResponseSession`)
| Property        | Type                 | Description |
| :---            | :---                 | :---        |
| `location`      | `string`             | Name of the location in which this session will take place. |
| `time`          | `[ number, number ]` | Begin and end times of this particular event session. |

### Response (`IEventResponseVolunteer`)
| Property        | Type                 | Description |
| :---            | :---                 | :---        |
| `name`          | `[ string, string ]` | Name of the volunteer, indicated as an array containing their first, then last name. |
| `identifier`    | `string`             | Unique identifier for this volunteer. Should be unique within this event. |
| `avatar`        | `string?`            | URL to the avatar image to use for the volunteer, if any. |

## /api/user
Allows information about the authenticated user to be obtained, both for verification of validity of
the authentication token, as for appropriate display of their information in the user interface.

### Request
A `GET` request with the `authToken` specified as a request parameter.

### Response (`IUserResponse`)
| Property        | Type                     | Description |
| :---            | :---                     | :---        |
| `administrator` | `boolean?`               | Whether this user is a portal administrator, providing special access. |
| `avatar`        | `string?`                | URL to the avatar image to use for the authenticated user, if any. |
| `events`        | `Map<string, EventRole>` | Mapping of an event identifier to the role this user has in it, if any. |
| `name`          | `string`                 | Full name of the authenticated user. |

### Administrators
The portal has a number of exceptions and behaviours reserved for users who are administrators. The API endpoint is expected to always validate whether a user _actually_ is an administrator when privileged actions are committed.

    * Administrators can always access the scheduling sub-application for an event.

### Event roles
There are three predefined event roles: `Unregistered`, `Registered`, `Rejected`. Any other string value may be used to represent that the volunteer has been accepted, and describe their actual role. (E.g. `Volunteer` or `Event Elf`.)
