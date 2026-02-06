type Issue = {
  path: (string | number)[];
  message: string;
};

type SafeParseSuccess<T> = { success: true; data: T };
type SafeParseFailure = { success: false; error: { issues: Issue[] } };
type SafeParseReturn<T> = SafeParseSuccess<T> | SafeParseFailure;

class ZodString {
  private readonly validators: Array<(value: string) => string | null>;

  constructor(validators: Array<(value: string) => string | null> = []) {
    this.validators = validators;
  }

  min(length: number, message = "Trop court.") {
    return new ZodString([
      ...this.validators,
      (value) => (value.length < length ? message : null),
    ]);
  }

  email(message = "Email invalide.") {
    return new ZodString([
      ...this.validators,
      (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message,
    ]);
  }

  _parse(value: unknown): SafeParseReturn<string> {
    if (typeof value !== "string") {
      return {
        success: false,
        error: { issues: [{ path: [], message: "Valeur invalide." }] },
      };
    }
    const issues = this.validators
      .map((validator) => validator(value))
      .filter((message): message is string => Boolean(message))
      .map((message) => ({ path: [], message }));

    if (issues.length > 0) {
      return { success: false, error: { issues } };
    }
    return { success: true, data: value };
  }
}

class ZodObject<Shape extends Record<string, ZodString>> {
  private readonly shape: Shape;

  constructor(shape: Shape) {
    this.shape = shape;
  }

  safeParse(values: Record<string, unknown>): SafeParseReturn<{
    [Key in keyof Shape]: string;
  }> {
    const issues: Issue[] = [];
    const data = {} as { [Key in keyof Shape]: string };

    Object.entries(this.shape).forEach(([key, schema]) => {
      const result = schema._parse(values[key]);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          issues.push({ path: [key, ...issue.path], message: issue.message });
        });
        return;
      }
      data[key as keyof Shape] = result.data;
    });

    if (issues.length > 0) {
      return { success: false, error: { issues } };
    }
    return { success: true, data };
  }
}

export const z = {
  string: () => new ZodString(),
  object: <Shape extends Record<string, ZodString>>(shape: Shape) =>
    new ZodObject(shape),
};
