/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // ShadCN UI compat
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ── ProBook Design System tokens ──────────────────────
        // Usage: bg-ds-bg-primary  text-ds-text-secondary  border-ds-border-default
        ds: {
          bg: {
            primary:   "var(--ds-bg-primary)",
            secondary: "var(--ds-bg-secondary)",
            tertiary:  "var(--ds-bg-tertiary)",
            inverse:   "var(--ds-bg-inverse)",
          },
          text: {
            primary:   "var(--ds-text-primary)",
            secondary: "var(--ds-text-secondary)",
            muted:     "var(--ds-text-muted)",
            disabled:  "var(--ds-text-disabled)",
            inverse:   "var(--ds-text-inverse)",
          },
          border: {
            DEFAULT: "var(--ds-border-default)",
            strong:  "var(--ds-border-strong)",
            inverse: "var(--ds-border-inverse)",
          },
          interactive: {
            DEFAULT: "var(--ds-interactive-default)",
            hover:   "var(--ds-interactive-hover)",
            subtle:  "var(--ds-interactive-subtle)",
          },
          feedback: {
            saved:         "var(--ds-feedback-saved)",
            "saved-bg":    "var(--ds-feedback-saved-bg)",
            rating:        "var(--ds-feedback-rating)",
            error:         "var(--ds-feedback-error)",
            "error-bg":    "var(--ds-feedback-error-bg)",
            success:       "var(--ds-feedback-success)",
            "success-bg":  "var(--ds-feedback-success-bg)",
            warning:       "var(--ds-feedback-warning)",
            "warning-bg":  "var(--ds-feedback-warning-bg)",
            info:          "var(--ds-feedback-info)",
            "info-bg":     "var(--ds-feedback-info-bg)",
          },
          avatar: {
            navy:   "var(--ds-avatar-navy)",
            teal:   "var(--ds-avatar-teal)",
            purple: "var(--ds-avatar-purple)",
          },
        },
      },
      borderRadius: {
        // ShadCN compat
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // ProBook DS radius tokens
        "ds-none": "var(--ds-radius-none)",
        "ds-xs":   "var(--ds-radius-xs)",
        "ds-sm":   "var(--ds-radius-sm)",
        "ds-md":   "var(--ds-radius-md)",
        "ds-lg":   "var(--ds-radius-lg)",
        "ds-xl":   "var(--ds-radius-xl)",
        "ds-2xl":  "var(--ds-radius-2xl)",
        "ds-full": "var(--ds-radius-full)",
      },
      spacing: {
        // ProBook DS spacing tokens (maps to same 4px scale as Tailwind default)
        // ds-1=4px ds-2=8px ds-3=12px ds-4=16px ds-5=20px ds-6=24px ds-8=32px ds-10=40px ds-12=48px ds-14=56px
        "ds-1":  "var(--ds-space-1)",
        "ds-2":  "var(--ds-space-2)",
        "ds-3":  "var(--ds-space-3)",
        "ds-4":  "var(--ds-space-4)",
        "ds-5":  "var(--ds-space-5)",
        "ds-6":  "var(--ds-space-6)",
        "ds-8":  "var(--ds-space-8)",
        "ds-10": "var(--ds-space-10)",
        "ds-12": "var(--ds-space-12)",
        "ds-14": "var(--ds-space-14)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
