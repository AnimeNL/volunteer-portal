# API Documentation
The volunteer portal requires a number of API calls in order to work properly. They can be provided
by any back-end, as long as the returned data matches the specification below. Both request and
response structures must be given as JSON.

## /api/auth

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
| `enableContent`      | `boolean` | Whether content pages for this event should be enabled. |
| `enableRegistration` | `boolean` | Whether volunteer registrations should be accepted for this event. |
| `enableSchedule`     | `boolean` | Whether access to the schedule should be enabled for this event. |
| `slug`               | `string`  | URL-safe representation of the event's name, e.g. _portalcon-2021_. |
| `timezone`           | `string`  | Timezone in which the event takes place, e.g. _Europe/London_. |
| `website`            | `string?` | URL to the website of the broader event. |

## /api/content

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
