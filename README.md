# Lambda@Edge OpenID Auth

Lambda functions for authenticating against OpenID providers

## Library choices

Lambda @ Edge are capped at 1048576 bytes for code so lib choice is important to minimize bundle size.

These libs are too big:

- node-jose
