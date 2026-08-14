# RST documentation application

This Next.js application renders the RST files in `../docs`. This README documents the application-specific React controls; standard RST features are not listed.

## Development

Install dependencies and start the documentation application with:

```shell
npm install
npm run dev
```

The development command starts Next.js and a local metadata service on port `5123`.

- Lab metadata: `http://localhost:5123/metadata`
- Deployment metadata: `http://localhost:5123/deployment`

Create a production build with:

```shell
npm run build
```

## React controls

React controls use the custom `react` directive:

```rst
.. react:: ComponentName
   :option: value
```

### DeploymentAccessMethods

Displays a table containing:

1. The deployment component name.
2. Each requested access-method name.
3. The exact, clickable URL constructed from the method protocol, host, and public port.

```rst
.. react:: DeploymentAccessMethods
   :deployment: Arcadia Crypto - Cluster
   :access-methods: Arcadia Crypto Origin Pool 1, Arcadia Crypto Origin Pool 2, Arcadia Crypto Origin Pool 3
```

Options:

| Option           | Required | Description                                                     |
| ---------------- | -------- | --------------------------------------------------------------- |
| `deployment`     | Yes      | Exact value of a component's `name` in `deployment.components`. |
| `access-methods` | Yes      | Comma-separated list of exact access-method `label` values.     |

The access methods may instead be supplied as directive body lines:

```rst
.. react:: DeploymentAccessMethods
   :deployment: Arcadia Crypto - Cluster

   Arcadia Crypto Origin Pool 1
   Arcadia Crypto Origin Pool 2
   Arcadia Crypto Origin Pool 3
```

The control searches all protocol groups under the matching component's `accessMethods` object. For example, an item under `https` with host `example.test` and port `443` produces `https://example.test`. Non-default ports are included in the URL.

Metadata endpoints:

- Development: `http://localhost:5123/deployment`
- Production: `http://metadata.udf/deployment`

If the component cannot be loaded, the control displays an error. Requested labels absent from the component are shown as `Not found`.

### DeploymentAccessMethodLink

Displays one deployment access method as an inline link. Only the access-method title is visible; its URL is loaded from deployment metadata.

Use the inline role inside a sentence:

```rst
Open :deployment-access-method:`Arcadia Crypto - Cluster|Arcadia Crypto Origin Pool 1` in a new browser tab.
```

The value before `|` is the exact component name, and the value after it is the exact access-method label. If metadata or the requested method cannot be loaded, the title remains visible as plain text.

The block control is also available when inline placement is not required:

```rst
.. react:: DeploymentAccessMethodLink
   :deployment: Arcadia Crypto - Cluster
   :access-method: Arcadia Crypto Origin Pool 1
```

### Clock

Displays the browser's current local date and time and refreshes it at the specified interval in milliseconds. The default interval is `1000`.

```rst
.. react:: Clock
   :interval: 1000
```

### LocalStorageValue

Displays a value from browser local storage.

```rst
.. react:: LocalStorageValue
   :name: namespace
   :fallback: not configured
```

Options:

| Option     | Required | Description                                 |
| ---------- | -------- | ------------------------------------------- |
| `name`     | Yes      | Local-storage key to read.                  |
| `fallback` | No       | Text displayed when the key does not exist. |

### Details

Displays collapsible content. The `summary` option sets the visible heading, and the directive body supplies the content.

```rst
.. react:: Details
   :summary: More information

   This content is initially collapsed.
```

Unknown React control names are rendered as warnings.
