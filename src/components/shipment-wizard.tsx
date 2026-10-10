"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Globe2,
  LoaderCircle,
  MapPin,
  PackageCheck,
  PackageOpen,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SearchableSelect } from "@/components/searchable-select";
import { apiRequest } from "@/lib/api-client";
import { fetchLocationCatalog } from "@/lib/location-catalog";

type Country = { id: string; name: string; iso2Code: string };
type Hub = {
  id: string;
  name: string;
  code: string;
  city: string;
  countryId: string;
  address: string;
};
type Quote = {
  chargeableWeightKg: number | string;
  actualWeightKg: number | string;
  volumetricWeightKg: number | string;
  priceUsd: number | string;
  currency: string;
  originCountry: { name: string };
  destinationCountry: { name: string };
  rateSnapshot?: unknown;
};

async function fetchActiveHubs() {
  const pageSize = 100;
  const firstPage = await apiRequest<Hub[]>(
    `hubs?page=1&limit=${pageSize}&isActive=true`,
  );
  const pageCount = Math.ceil(
    (firstPage.meta?.total ?? firstPage.data.length) / pageSize,
  );
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      apiRequest<Hub[]>(
        `hubs?page=${index + 2}&limit=${pageSize}&isActive=true`,
      ),
    ),
  );
  return {
    ...firstPage,
    data: [...firstPage.data, ...remainingPages.flatMap((page) => page.data)],
  };
}
type CreatedShipment = {
  id: string;
  trackingNumber: string;
  priceUsd: number | string;
  currency: string;
  status: string;
};
const numeric = (label: string, min: number, max: number) =>
  z
    .string()
    .min(1, `${label} is required.`)
    .refine(
      (value) =>
        Number.isFinite(Number(value)) &&
        Number(value) >= min &&
        Number(value) <= max,
      `${label} must be between ${min} and ${max}.`,
    );
const optionalNumeric = (label: string) =>
  z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || (Number.isFinite(Number(value)) && Number(value) > 0),
      `${label} must be a positive number.`,
    );
const schema = z
  .object({
    direction: z.enum(["EXPORT", "IMPORT"]),
    shipmentType: z.enum(["DOCUMENT", "PARCEL"]),
    originCountryId: z.string().min(1, "Choose an origin country."),
    destinationCountryId: z.string().min(1, "Choose a destination country."),
    originHubId: z.string().min(1, "Choose an origin hub."),
    destinationHubId: z.string().min(1, "Choose a destination hub."),
    weightKg: numeric("Weight", 0.01, 500),
    lengthCm: optionalNumeric("Length"),
    widthCm: optionalNumeric("Width"),
    heightCm: optionalNumeric("Height"),
    pickupScheduledAt: z.string().optional(),
    senderName: z.string().min(2, "Enter the sender’s name."),
    senderPhone: z.string().min(6, "Enter a valid phone number."),
    senderEmail: z
      .union([z.email("Enter a valid email."), z.literal("")])
      .optional(),
    senderAddress: z.string().min(5, "Enter a complete street address."),
    senderCity: z.string().min(2, "Enter a city."),
    senderPostalCode: z.string().optional(),
    recipientName: z.string().min(2, "Enter the recipient’s name."),
    recipientPhone: z.string().min(6, "Enter a valid phone number."),
    recipientEmail: z
      .union([z.email("Enter a valid email."), z.literal("")])
      .optional(),
    recipientAddress: z.string().min(5, "Enter a complete street address."),
    recipientCity: z.string().min(2, "Enter a city."),
    recipientPostalCode: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.originCountryId === value.destinationCountryId)
      context.addIssue({
        code: "custom",
        path: ["destinationCountryId"],
        message: "Choose two different countries.",
      });
  });
type Values = z.infer<typeof schema>;
const defaults: Values = {
  direction: "EXPORT",
  shipmentType: "PARCEL",
  originCountryId: "",
  destinationCountryId: "",
  originHubId: "",
  destinationHubId: "",
  weightKg: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  pickupScheduledAt: "",
  senderName: "",
  senderPhone: "",
  senderEmail: "",
  senderAddress: "",
  senderCity: "",
  senderPostalCode: "",
  recipientName: "",
  recipientPhone: "",
  recipientEmail: "",
  recipientAddress: "",
  recipientCity: "",
  recipientPostalCode: "",
};
const money = (value: number | string) => `$${Number(value).toFixed(2)}`;

function Field({
  label,
  name,
  register,
  error,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  name: FieldPath<Values>;
  register: ReturnType<typeof useForm<Values>>["register"];
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="wizard-field">
      <label htmlFor={name}>
        {label}
        {required && <i> *</i>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        aria-invalid={!!error}
      />
      {error && <small>{error}</small>}
    </div>
  );
}

export function ShipmentWizard() {
  const router = useRouter();
  const cache = useQueryClient();
  const [step, setStep] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: "onTouched",
  });
  const countries = useQuery({
    queryKey: ["countries"],
    queryFn: () => apiRequest<Country[]>("countries"),
  });
  const hubs = useQuery({
    queryKey: ["hubs", "booking"],
    queryFn: fetchActiveHubs,
  });
  const values = form.watch();
  const locationCatalog = useQuery({
    queryKey: ["location-catalog"],
    queryFn: fetchLocationCatalog,
    enabled: Boolean(values.originCountryId || values.destinationCountryId),
    staleTime: Infinity,
  });
  const origins = useMemo(
    () =>
      hubs.data?.data?.filter(
        (hub) => hub.countryId === values.originCountryId,
      ) ?? [],
    [hubs.data, values.originCountryId],
  );
  const destinations = useMemo(
    () =>
      hubs.data?.data?.filter(
        (hub) => hub.countryId === values.destinationCountryId,
      ) ?? [],
    [hubs.data, values.destinationCountryId],
  );
  const origin = countries.data?.data?.find(
    (country) => country.id === values.originCountryId,
  );
  const destination = countries.data?.data?.find(
    (country) => country.id === values.destinationCountryId,
  );
  const originCities =
    locationCatalog.data?.citiesByCountry[origin?.iso2Code ?? ""] ?? [];
  const destinationCities =
    locationCatalog.data?.citiesByCountry[destination?.iso2Code ?? ""] ?? [];
  const errors = form.formState.errors;
  const quoteFields: FieldPath<Values>[] = [
    "direction",
    "shipmentType",
    "originCountryId",
    "destinationCountryId",
    "weightKg",
    "lengthCm",
    "widthCm",
    "heightCm",
  ];
  const contactFields: FieldPath<Values>[] = [
    "originHubId",
    "destinationHubId",
    "senderName",
    "senderPhone",
    "senderEmail",
    "senderAddress",
    "senderCity",
    "senderPostalCode",
    "recipientName",
    "recipientPhone",
    "recipientEmail",
    "recipientAddress",
    "recipientCity",
    "recipientPostalCode",
  ];

  async function moveToContact() {
    if (!(await form.trigger(quoteFields))) return;
    try {
      const data = form.getValues();
      const result = await apiRequest<Quote>("shipments/quote", {
        method: "POST",
        body: JSON.stringify({
          direction: data.direction,
          shipmentType: data.shipmentType,
          originCountryId: data.originCountryId,
          destinationCountryId: data.destinationCountryId,
          weightKg: Number(data.weightKg),
          lengthCm: data.lengthCm ? Number(data.lengthCm) : undefined,
          widthCm: data.widthCm ? Number(data.widthCm) : undefined,
          heightCm: data.heightCm ? Number(data.heightCm) : undefined,
        }),
      });
      setQuote(result.data);
      setStep(1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not calculate a quote.",
      );
    }
  }

  async function moveToReview() {
    if (await form.trigger(contactFields)) setStep(2);
  }

  async function createAndPay() {
    const data = form.getValues();
    if (!(await form.trigger([...quoteFields, ...contactFields]))) {
      setStep(0);
      toast.error("Review the highlighted shipment details before continuing.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        direction: data.direction,
        shipmentType: data.shipmentType,
        originCountryId: data.originCountryId,
        destinationCountryId: data.destinationCountryId,
        originHubId: data.originHubId,
        destinationHubId: data.destinationHubId,
        weightKg: Number(data.weightKg),
        lengthCm: data.lengthCm ? Number(data.lengthCm) : undefined,
        widthCm: data.widthCm ? Number(data.widthCm) : undefined,
        heightCm: data.heightCm ? Number(data.heightCm) : undefined,
        pickupScheduledAt: data.pickupScheduledAt
          ? new Date(data.pickupScheduledAt).toISOString()
          : undefined,
        sender: {
          name: data.senderName,
          phone: data.senderPhone,
          email: data.senderEmail || undefined,
          address: data.senderAddress,
          city: data.senderCity,
          countryId: data.originCountryId,
          postalCode: data.senderPostalCode || undefined,
        },
        recipient: {
          name: data.recipientName,
          phone: data.recipientPhone,
          email: data.recipientEmail || undefined,
          address: data.recipientAddress,
          city: data.recipientCity,
          countryId: data.destinationCountryId,
          postalCode: data.recipientPostalCode || undefined,
        },
      };
      const created = await apiRequest<CreatedShipment>("shipments", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const shipment = created.data;
      const payment = await apiRequest<{ checkoutUrl: string }>(
        `payments/${shipment.id}/initiate`,
        { method: "POST", body: JSON.stringify({}) },
      );
      if (!payment.data.checkoutUrl)
        throw new Error(
          "Stripe did not return a checkout link. Your shipment is saved and can be paid from My shipments.",
        );
      await cache.invalidateQueries({ queryKey: ["my-shipments"] });
      window.location.assign(payment.data.checkoutUrl);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "We couldn’t continue to checkout.",
      );
      setSubmitting(false);
      await cache.invalidateQueries({ queryKey: ["my-shipments"] });
      if (
        error instanceof Error &&
        error.message.includes("Stripe did not return")
      )
        router.push("/dashboard/shipments");
    }
  }

  const issue = (name: FieldPath<Values>) =>
    errors[name]?.message as string | undefined;
  const steps = ["Route & parcel", "People & pickup", "Review & pay"];
  return (
    <div className="dashboard-page wizard-page">
      <div className="wizard-heading">
        <Link href="/dashboard" className="back-workspace">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <span className="eyebrow">A GOOD JOURNEY STARTS HERE</span>
        <h1>
          Let’s send something <em>well.</em>
        </h1>
        <p>
          Tell us a little about the route. We’ll show the price before you
          book.
        </p>
      </div>
      <ol className="wizard-stepper" aria-label="Shipment booking steps">
        {steps.map((label, index) => (
          <li
            key={label}
            className={
              index === step ? "active" : index < step ? "complete" : ""
            }
          >
            <span>{index < step ? <Check size={13} /> : index + 1}</span>
            <div>
              <small>STEP {index + 1}</small>
              <strong>{label}</strong>
            </div>
          </li>
        ))}
      </ol>
      <form
        className="wizard-panel"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        {step === 0 && (
          <div className="wizard-step-content">
            <div className="wizard-section-title">
              <span className="wizard-section-icon">
                <Globe2 size={17} />
              </span>
              <div>
                <h2>Where is it going?</h2>
                <p>Choose a direction and the two countries for your route.</p>
              </div>
            </div>
            <div className="wizard-grid wizard-grid-two">
              <div className="wizard-field">
                <label htmlFor="direction">
                  Shipping direction <i>*</i>
                </label>
                <SearchableSelect
                  id="direction"
                  value={values.direction}
                  onValueChange={(value) =>
                    form.setValue("direction", value as Values["direction"], {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                  options={[
                    { value: "EXPORT", label: "Export — sending out" },
                    { value: "IMPORT", label: "Import — receiving in" },
                  ]}
                />
              </div>
              <div className="wizard-field">
                <label htmlFor="shipmentType">
                  What are you sending? <i>*</i>
                </label>
                <SearchableSelect
                  id="shipmentType"
                  value={values.shipmentType}
                  onValueChange={(value) =>
                    form.setValue(
                      "shipmentType",
                      value as Values["shipmentType"],
                      {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      },
                    )
                  }
                  options={[
                    { value: "PARCEL", label: "Parcel" },
                    { value: "DOCUMENT", label: "Documents" },
                  ]}
                />
              </div>
              <div className="wizard-field">
                <label htmlFor="originCountryId">
                  From country <i>*</i>
                </label>
                <SearchableSelect
                  id="originCountryId"
                  value={values.originCountryId}
                  onValueChange={(value) => {
                    form.setValue("originCountryId", value, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                    form.setValue("originHubId", "");
                    form.setValue("senderCity", "");
                    setQuote(null);
                  }}
                  placeholder="Choose a country"
                  aria-invalid={!!issue("originCountryId")}
                  options={(countries.data?.data ?? []).map((country) => ({
                    value: country.id,
                    label: country.name,
                    keywords: country.iso2Code,
                  }))}
                />
                {issue("originCountryId") && (
                  <small>{issue("originCountryId")}</small>
                )}
              </div>
              <div className="wizard-field">
                <label htmlFor="destinationCountryId">
                  To country <i>*</i>
                </label>
                <SearchableSelect
                  id="destinationCountryId"
                  value={values.destinationCountryId}
                  onValueChange={(value) => {
                    form.setValue("destinationCountryId", value, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                    form.setValue("destinationHubId", "");
                    form.setValue("recipientCity", "");
                    setQuote(null);
                  }}
                  placeholder="Choose a country"
                  aria-invalid={!!issue("destinationCountryId")}
                  options={(countries.data?.data ?? []).map((country) => ({
                    value: country.id,
                    label: country.name,
                    keywords: country.iso2Code,
                  }))}
                />
                {issue("destinationCountryId") && (
                  <small>{issue("destinationCountryId")}</small>
                )}
              </div>
            </div>
            <div className="wizard-section-title wizard-subsection">
              <span className="wizard-section-icon">
                <PackageOpen size={17} />
              </span>
              <div>
                <h2>Tell us about the shipment</h2>
                <p>
                  Enter actual weight. We’ll calculate the chargeable weight
                  from package size.
                </p>
              </div>
            </div>
            <div className="wizard-grid wizard-grid-four">
              <Field
                label="Weight (kg)"
                name="weightKg"
                register={form.register}
                error={issue("weightKg")}
                type="number"
                placeholder="e.g. 2.5"
              />
              <Field
                label="Length (cm)"
                name="lengthCm"
                register={form.register}
                error={issue("lengthCm")}
                type="number"
                placeholder="Optional"
                required={false}
              />
              <Field
                label="Width (cm)"
                name="widthCm"
                register={form.register}
                error={issue("widthCm")}
                type="number"
                placeholder="Optional"
                required={false}
              />
              <Field
                label="Height (cm)"
                name="heightCm"
                register={form.register}
                error={issue("heightCm")}
                type="number"
                placeholder="Optional"
                required={false}
              />
            </div>
            {countries.isError && (
              <div className="inline-api-message">
                <Globe2 size={15} />
                <span>{countries.error.message}</span>
                <button type="button" onClick={() => countries.refetch()}>
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
        {step === 1 && (
          <div className="wizard-step-content">
            <div className="wizard-section-title">
              <span className="wizard-section-icon">
                <MapPin size={17} />
              </span>
              <div>
                <h2>Who’s sending and receiving?</h2>
                <p>
                  We use this to validate the hubs and prepare pickup details.
                </p>
              </div>
            </div>
            {hubs.isError && (
              <div className="inline-api-message">
                <MapPin size={15} />
                <span>{hubs.error.message}</span>
                <button type="button" onClick={() => hubs.refetch()}>
                  Try again
                </button>
              </div>
            )}
            {locationCatalog.isError && (
              <div className="inline-api-message">
                <MapPin size={15} />
                <span>{locationCatalog.error.message}</span>
                <button type="button" onClick={() => locationCatalog.refetch()}>
                  Try again
                </button>
              </div>
            )}
            <div className="contact-columns">
              <fieldset className="contact-card">
                <legend>
                  <span className="contact-dot sender-dot" /> Sender{" "}
                  <small>{origin?.name ?? "Origin country"}</small>
                </legend>
                <div className="wizard-grid wizard-grid-two">
                  <Field
                    label="Full name"
                    name="senderName"
                    register={form.register}
                    error={issue("senderName")}
                    placeholder="Sender’s name"
                  />
                  <Field
                    label="Phone"
                    name="senderPhone"
                    register={form.register}
                    error={issue("senderPhone")}
                    type="tel"
                    placeholder="Include country code"
                  />
                  <Field
                    label="Email"
                    name="senderEmail"
                    register={form.register}
                    error={issue("senderEmail")}
                    type="email"
                    placeholder="Optional"
                    required={false}
                  />
                  <div className="wizard-field">
                    <label htmlFor="senderCity">
                      City <i>*</i>
                    </label>
                    <SearchableSelect
                      id="senderCity"
                      value={values.senderCity}
                      onValueChange={(value) =>
                        form.setValue("senderCity", value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      placeholder={
                        !values.originCountryId
                          ? "Choose a country first"
                          : locationCatalog.isPending
                            ? "Loading city list…"
                            : "Choose a city"
                      }
                      aria-invalid={!!issue("senderCity")}
                      disabled={
                        !values.originCountryId ||
                        locationCatalog.isPending ||
                        originCities.length === 0
                      }
                      maxOptions={80}
                      options={originCities.map((city) => ({
                        value: city,
                        label: city,
                      }))}
                    />
                    {issue("senderCity") && (
                      <small>{issue("senderCity")}</small>
                    )}
                    {values.originCountryId &&
                      !locationCatalog.isPending &&
                      !locationCatalog.isError &&
                      originCities.length === 0 && (
                        <small>No cities are listed for this country.</small>
                      )}
                  </div>
                  <div className="wizard-span-two">
                    <Field
                      label="Street address"
                      name="senderAddress"
                      register={form.register}
                      error={issue("senderAddress")}
                      placeholder="Building, street and area"
                    />
                  </div>
                  <Field
                    label="Postal code"
                    name="senderPostalCode"
                    register={form.register}
                    error={issue("senderPostalCode")}
                    placeholder="Optional"
                    required={false}
                  />
                  <div className="wizard-field">
                    <label htmlFor="originHubId">
                      Pickup hub <i>*</i>
                    </label>
                    <SearchableSelect
                      id="originHubId"
                      value={values.originHubId}
                      onValueChange={(value) =>
                        form.setValue("originHubId", value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      placeholder="Choose a hub"
                      aria-invalid={!!issue("originHubId")}
                      disabled={
                        !values.originCountryId ||
                        hubs.isPending ||
                        origins.length === 0
                      }
                      options={origins.map((hub) => ({
                        value: hub.id,
                        label: `${hub.name} · ${hub.city}`,
                        keywords: hub.code,
                      }))}
                    />
                    {issue("originHubId") && (
                      <small>{issue("originHubId")}</small>
                    )}
                    {values.originCountryId && origins.length === 0 && (
                      <small>
                        No active hubs are available for this country.
                      </small>
                    )}
                  </div>
                </div>
              </fieldset>
              <fieldset className="contact-card">
                <legend>
                  <span className="contact-dot recipient-dot" /> Recipient{" "}
                  <small>{destination?.name ?? "Destination country"}</small>
                </legend>
                <div className="wizard-grid wizard-grid-two">
                  <Field
                    label="Full name"
                    name="recipientName"
                    register={form.register}
                    error={issue("recipientName")}
                    placeholder="Recipient’s name"
                  />
                  <Field
                    label="Phone"
                    name="recipientPhone"
                    register={form.register}
                    error={issue("recipientPhone")}
                    type="tel"
                    placeholder="Include country code"
                  />
                  <Field
                    label="Email"
                    name="recipientEmail"
                    register={form.register}
                    error={issue("recipientEmail")}
                    type="email"
                    placeholder="Optional"
                    required={false}
                  />
                  <div className="wizard-field">
                    <label htmlFor="recipientCity">
                      City <i>*</i>
                    </label>
                    <SearchableSelect
                      id="recipientCity"
                      value={values.recipientCity}
                      onValueChange={(value) =>
                        form.setValue("recipientCity", value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      placeholder={
                        !values.destinationCountryId
                          ? "Choose a country first"
                          : locationCatalog.isPending
                            ? "Loading city list…"
                            : "Choose a city"
                      }
                      aria-invalid={!!issue("recipientCity")}
                      disabled={
                        !values.destinationCountryId ||
                        locationCatalog.isPending ||
                        destinationCities.length === 0
                      }
                      maxOptions={80}
                      options={destinationCities.map((city) => ({
                        value: city,
                        label: city,
                      }))}
                    />
                    {issue("recipientCity") && (
                      <small>{issue("recipientCity")}</small>
                    )}
                    {values.destinationCountryId &&
                      !locationCatalog.isPending &&
                      !locationCatalog.isError &&
                      destinationCities.length === 0 && (
                        <small>No cities are listed for this country.</small>
                      )}
                  </div>
                  <div className="wizard-span-two">
                    <Field
                      label="Street address"
                      name="recipientAddress"
                      register={form.register}
                      error={issue("recipientAddress")}
                      placeholder="Building, street and area"
                    />
                  </div>
                  <Field
                    label="Postal code"
                    name="recipientPostalCode"
                    register={form.register}
                    error={issue("recipientPostalCode")}
                    placeholder="Optional"
                    required={false}
                  />
                  <div className="wizard-field">
                    <label htmlFor="destinationHubId">
                      Destination hub <i>*</i>
                    </label>
                    <SearchableSelect
                      id="destinationHubId"
                      value={values.destinationHubId}
                      onValueChange={(value) =>
                        form.setValue("destinationHubId", value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      placeholder="Choose a hub"
                      aria-invalid={!!issue("destinationHubId")}
                      disabled={
                        !values.destinationCountryId ||
                        hubs.isPending ||
                        destinations.length === 0
                      }
                      options={destinations.map((hub) => ({
                        value: hub.id,
                        label: `${hub.name} · ${hub.city}`,
                        keywords: hub.code,
                      }))}
                    />
                    {issue("destinationHubId") && (
                      <small>{issue("destinationHubId")}</small>
                    )}
                    {values.destinationCountryId &&
                      destinations.length === 0 && (
                        <small>
                          No active hubs are available for this country.
                        </small>
                      )}
                  </div>
                </div>
              </fieldset>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="wizard-step-content">
            <div className="wizard-section-title">
              <span className="wizard-section-icon">
                <ShieldCheck size={17} />
              </span>
              <div>
                <h2>Everything look right?</h2>
                <p>
                  Review the route and price, then continue to secure Stripe
                  checkout.
                </p>
              </div>
            </div>
            <div className="review-route">
              <div>
                <small>FROM</small>
                <strong>{origin?.name}</strong>
                <span>{form.getValues("senderCity")}</span>
              </div>
              <span className="review-route-line">
                <i />
                <ArrowRight size={15} />
                <i />
              </span>
              <div>
                <small>TO</small>
                <strong>{destination?.name}</strong>
                <span>{form.getValues("recipientCity")}</span>
              </div>
            </div>
            <div className="review-grid">
              <div className="review-detail">
                <span>SHIPMENT</span>
                <strong>
                  {values.shipmentType.toLowerCase()} ·{" "}
                  {values.direction.toLowerCase()}
                </strong>
                <small>
                  {values.weightKg} kg actual weight ·{" "}
                  {quote?.chargeableWeightKg} kg chargeable
                </small>
              </div>
              <div className="review-detail">
                <span>ORIGIN HUB</span>
                <strong>
                  {origins.find((hub) => hub.id === values.originHubId)?.name}
                </strong>
                <small>
                  {origins.find((hub) => hub.id === values.originHubId)?.city}
                </small>
              </div>
              <div className="review-detail">
                <span>DESTINATION HUB</span>
                <strong>
                  {
                    destinations.find(
                      (hub) => hub.id === values.destinationHubId,
                    )?.name
                  }
                </strong>
                <small>
                  {
                    destinations.find(
                      (hub) => hub.id === values.destinationHubId,
                    )?.city
                  }
                </small>
              </div>
              <div className="review-detail">
                <span>RECIPIENT</span>
                <strong>{values.recipientName}</strong>
                <small>
                  {values.recipientPhone} · {values.recipientAddress}
                </small>
              </div>
            </div>
            <div className="price-total">
              <span>
                <CircleDollarSign size={20} />
                <span>
                  <small>YOUR SHIPMENT QUOTE</small>
                  <strong>Stripe test checkout · USD</strong>
                </span>
              </span>
              <b>{money(quote?.priceUsd ?? 0)}</b>
            </div>
            <div className="secure-note">
              <ShieldCheck size={15} /> Your payment is processed securely by
              Stripe. Payment confirmation comes from the ShipperEx backend.
            </div>
          </div>
        )}
        <div className="wizard-actions">
          {step > 0 ? (
            <button
              type="button"
              className="wizard-back focus-ring"
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <Link href="/dashboard" className="wizard-back">
              <ArrowLeft size={14} /> Save for later
            </Link>
          )}
          {step === 0 ? (
            <button
              type="button"
              className="workspace-primary"
              onClick={moveToContact}
              disabled={countries.isPending}
            >
              Get my quote <ArrowRight size={14} />
            </button>
          ) : step === 1 ? (
            <button
              type="button"
              className="workspace-primary"
              onClick={moveToReview}
            >
              Review shipment <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              className="workspace-primary"
              onClick={createAndPay}
              disabled={submitting}
            >
              {submitting ? (
                <LoaderCircle className="spin" size={15} />
              ) : (
                <>
                  <ShieldCheck size={15} /> Create & pay with Stripe
                </>
              )}
            </button>
          )}
        </div>
      </form>
      <div className="wizard-footnote">
        <ShieldCheck size={13} /> Real API rates, no hidden fees. You’ll confirm
        payment through Stripe test mode.
      </div>
    </div>
  );
}
