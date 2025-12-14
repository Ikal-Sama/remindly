# ActionButton Component Usage

A dynamic, reusable button component that supports various use cases including social buttons, loading states, and alert dialogs.

## Components Available

1. **ActionButtonSimple** - Works immediately without additional dependencies
2. **ActionButton** - Full version with alert dialog support (requires `@radix-ui/react-alert-dialog`)

## Basic Usage

```tsx
import { ActionButtonSimple } from "@/components/action-button-simple";

// Basic button
<ActionButtonSimple onClick={() => console.log("clicked")}>
  Click me
</ActionButtonSimple>

// With icon
<ActionButtonSimple
  onClick={handleDownload}
  icon={<Download />}
  iconPosition="left"
>
  Download
</ActionButtonSimple>
```

## Social Buttons

```tsx
// Google sign-in
<ActionButtonSimple
  socialButton={{
    provider: "google",
    onClick: async () => {
      await signInWithGoogle();
    }
  }}
/>

// GitHub sign-in
<ActionButtonSimple
  socialButton={{
    provider: "github",
    onClick: async () => {
      await signInWithGitHub();
    }
  }}
/>
```

Available providers: `google`, `github`, `twitter`, `facebook`, `apple`

## Variants and Sizes

```tsx
// Different variants
<ActionButtonSimple variant="default">Default</ActionButtonSimple>
<ActionButtonSimple variant="destructive">Delete</ActionButtonSimple>
<ActionButtonSimple variant="outline">Outline</ActionButtonSimple>
<ActionButtonSimple variant="secondary">Secondary</ActionButtonSimple>
<ActionButtonSimple variant="ghost">Ghost</ActionButtonSimple>

// Different sizes
<ActionButtonSimple size="sm">Small</ActionButtonSimple>
<ActionButtonSimple size="default">Default</ActionButtonSimple>
<ActionButtonSimple size="lg">Large</ActionButtonSimple>
<ActionButtonSimple size="icon" icon={<Settings />} />
```

## Loading States

```tsx
// Manual loading
<ActionButtonSimple loading>
  Processing...
</ActionButtonSimple>

// Social button loading
<ActionButtonSimple
  socialButton={{
    provider: "google",
    onClick: handleGoogleSignIn,
    loading: isLoading
  }}
/>
```

## Full Width

```tsx
<ActionButtonSimple fullWidth onClick={handleSubmit}>
  Submit Form
</ActionButtonSimple>
```

## Alert Dialog (Full Version Only)

Install the dependency first:

```bash
npm install @radix-ui/react-alert-dialog
```

Then use the full ActionButton:

```tsx
import { ActionButton } from "@/components/action-button";

<ActionButton
  variant="destructive"
  icon={<Trash2 />}
  alertDialog={{
    title: "Are you sure?",
    description:
      "This action cannot be undone. This will permanently delete your item.",
    confirmText: "Delete",
    cancelText: "Cancel",
    onConfirm: async () => {
      await deleteItem();
    },
    destructive: true,
  }}
>
  Delete Item
</ActionButton>;
```

## Props Reference

### ActionButtonConfig

- `variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"`
- `size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"`
- `disabled?: boolean`
- `loading?: boolean`
- `icon?: React.ReactNode`
- `iconPosition?: "left" | "right"`
- `fullWidth?: boolean`

### SocialButtonConfig

- `provider: "google" | "github" | "twitter" | "facebook" | "apple"`
- `onClick?: () => void | Promise<void>`
- `loading?: boolean`

### AlertDialogConfig (Full Version Only)

- `title: string`
- `description: string`
- `confirmText?: string`
- `cancelText?: string`
- `onConfirm: () => void | Promise<void>`
- `destructive?: boolean`

## Examples in Your Project

Check out `components/action-button-demo.tsx` for comprehensive examples, and see the updated `components/login-form.tsx` for a real-world usage example.
