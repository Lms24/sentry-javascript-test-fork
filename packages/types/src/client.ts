import type { Breadcrumb, BreadcrumbHint } from './breadcrumb';
import type { CheckIn, MonitorConfig } from './checkin';
import type { EventDropReason } from './clientreport';
import type { DataCategory } from './datacategory';
import type { DsnComponents } from './dsn';
import type { DynamicSamplingContext, Envelope } from './envelope';
import type { Event, EventHint } from './event';
import type { EventProcessor } from './eventprocessor';
import type { FeedbackEvent } from './feedback';
import type { Integration } from './integration';
import type { ClientOptions } from './options';
import type { ParameterizedString } from './parameterize';
import type { Scope } from './scope';
import type { SdkMetadata } from './sdkmetadata';
import type { Session, SessionAggregates } from './session';
import type { SeverityLevel } from './severity';
import type { Span, SpanAttributes, SpanContextData } from './span';
import type { StartSpanOptions } from './startSpanOptions';
import type { Transport, TransportMakeRequestResponse } from './transport';

/**
 * User-Facing Sentry SDK Client.
 *
 * This interface contains all methods to interface with the SDK once it has
 * been installed. It allows to send events to Sentry, record breadcrumbs and
 * set a context included in every event. Since the SDK mutates its environment,
 * there will only be one instance during runtime.
 *
 */
export interface Client<O extends ClientOptions = ClientOptions> {
  /**
   * Captures an exception event and sends it to Sentry.
   *
   * Unlike `captureException` exported from every SDK, this method requires that you pass it the current scope.
   *
   * @param exception An exception-like object.
   * @param hint May contain additional information about the original exception.
   * @param currentScope An optional scope containing event metadata.
   * @returns The event id
   */
  captureException(exception: any, hint?: EventHint, currentScope?: Scope): string;

  /**
   * Captures a message event and sends it to Sentry.
   *
   * Unlike `captureMessage` exported from every SDK, this method requires that you pass it the current scope.
   *
   * @param message The message to send to Sentry.
   * @param level Define the level of the message.
   * @param hint May contain additional information about the original exception.
   * @param currentScope An optional scope containing event metadata.
   * @returns The event id
   */
  captureMessage(message: string, level?: SeverityLevel, hint?: EventHint, currentScope?: Scope): string;

  /**
   * Captures a manually created event and sends it to Sentry.
   *
   * Unlike `captureEvent` exported from every SDK, this method requires that you pass it the current scope.
   *
   * @param event The event to send to Sentry.
   * @param hint May contain additional information about the original exception.
   * @param currentScope An optional scope containing event metadata.
   * @returns The event id
   */
  captureEvent(event: Event, hint?: EventHint, currentScope?: Scope): string;

  /**
   * Captures a session
   *
   * @param session Session to be delivered
   */
  captureSession(session: Session): void;

  /**
   * Create a cron monitor check in and send it to Sentry. This method is not available on all clients.
   *
   * @param checkIn An object that describes a check in.
   * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
   * to create a monitor automatically when sending a check in.
   * @param scope An optional scope containing event metadata.
   * @returns A string representing the id of the check in.
   */
  captureCheckIn?(checkIn: CheckIn, monitorConfig?: MonitorConfig, scope?: Scope): string;

  /** Returns the current Dsn. */
  getDsn(): DsnComponents | undefined;

  /** Returns the current options. */
  getOptions(): O;

  /**
   * @inheritdoc
   *
   */
  getSdkMetadata(): SdkMetadata | undefined;

  /**
   * Returns the transport that is used by the client.
   * Please note that the transport gets lazy initialized so it will only be there once the first event has been sent.
   *
   * @returns The transport.
   */
  getTransport(): Transport | undefined;

  /**
   * Flush the event queue and set the client to `enabled = false`. See {@link Client.flush}.
   *
   * @param timeout Maximum time in ms the client should wait before shutting down. Omitting this parameter will cause
   *   the client to wait until all events are sent before disabling itself.
   * @returns A promise which resolves to `true` if the flush completes successfully before the timeout, or `false` if
   * it doesn't.
   */
  close(timeout?: number): PromiseLike<boolean>;

  /**
   * Wait for all events to be sent or the timeout to expire, whichever comes first.
   *
   * @param timeout Maximum time in ms the client should wait for events to be flushed. Omitting this parameter will
   *   cause the client to wait until all events are sent before resolving the promise.
   * @returns A promise that will resolve with `true` if all events are sent before the timeout, or `false` if there are
   * still events in the queue when the timeout is reached.
   */
  flush(timeout?: number): PromiseLike<boolean>;

  /**
   * Adds an event processor that applies to any event processed by this client.
   */
  addEventProcessor(eventProcessor: EventProcessor): void;

  /**
   * Get all added event processors for this client.
   */
  getEventProcessors(): EventProcessor[];

  /** Get the instance of the integration with the given name on the client, if it was added. */
  getIntegrationByName<T extends Integration = Integration>(name: string): T | undefined;

  /**
   * Add an integration to the client.
   * This can be used to e.g. lazy load integrations.
   * In most cases, this should not be necessary, and you're better off just passing the integrations via `integrations: []` at initialization time.
   * However, if you find the need to conditionally load & add an integration, you can use `addIntegration` to do so.
   *
   * */
  addIntegration(integration: Integration): void;

  /**
   * Initialize this client.
   * Call this after the client was set on a scope.
   */
  init(): void;

  /** Creates an {@link Event} from all inputs to `captureException` and non-primitive inputs to `captureMessage`. */
  eventFromException(exception: any, hint?: EventHint): PromiseLike<Event>;

  /** Creates an {@link Event} from primitive inputs to `captureMessage`. */
  eventFromMessage(message: ParameterizedString, level?: SeverityLevel, hint?: EventHint): PromiseLike<Event>;

  /** Submits the event to Sentry */
  sendEvent(event: Event, hint?: EventHint): void;

  /** Submits the session to Sentry */
  sendSession(session: Session | SessionAggregates): void;

  /** Sends an envelope to Sentry */
  sendEnvelope(envelope: Envelope): PromiseLike<TransportMakeRequestResponse>;

  /**
   * Record on the client that an event got dropped (ie, an event that will not be sent to sentry).
   *
   * @param reason The reason why the event got dropped.
   * @param category The data category of the dropped event.
   * @param event The dropped event.
   */
  recordDroppedEvent(reason: EventDropReason, dataCategory: DataCategory, event?: Event): void;

  // HOOKS
  /* eslint-disable @typescript-eslint/unified-signatures */

  /**
   * Register a callback for whenever a span is started.
   * Receives the span as argument.
   */
  on(hook: 'spanStart', callback: (span: Span) => void): void;

  /**
   * Register a callback before span sampling runs. Receives a `samplingDecision` object argument with a `decision`
   * property that can be used to make a sampling decision that will be enforced, before any span sampling runs.
   */
  on(
    hook: 'beforeSampling',
    callback: (
      samplingData: {
        spanAttributes: SpanAttributes;
        spanName: string;
        parentSampled?: boolean;
        parentContext?: SpanContextData;
      },
      samplingDecision: { decision: boolean },
    ) => void,
  ): void;

  /**
   * Register a callback for whenever a span is ended.
   * Receives the span as argument.
   */
  on(hook: 'spanEnd', callback: (span: Span) => void): void;

  /**
   * Register a callback for when an idle span is allowed to auto-finish.
   */
  on(hook: 'idleSpanEnableAutoFinish', callback: (span: Span) => void): void;

  /**
   * Register a callback for transaction start and finish.
   */
  on(hook: 'beforeEnvelope', callback: (envelope: Envelope) => void): void;

  /**
   * Register a callback for before sending an event.
   * This is called right before an event is sent and should not be used to mutate the event.
   * Receives an Event & EventHint as arguments.
   */
  on(hook: 'beforeSendEvent', callback: (event: Event, hint?: EventHint | undefined) => void): void;

  /**
   * Register a callback for preprocessing an event,
   * before it is passed to (global) event processors.
   * Receives an Event & EventHint as arguments.
   */
  on(hook: 'preprocessEvent', callback: (event: Event, hint?: EventHint | undefined) => void): void;

  /**
   * Register a callback for when an event has been sent.
   */
  on(hook: 'afterSendEvent', callback: (event: Event, sendResponse: TransportMakeRequestResponse) => void): void;

  /**
   * Register a callback when a breadcrumb is to be added.
   */
  on(hook: 'preprocessAddBreadcrumb', callback: (breadcrumb: Breadcrumb, hint?: BreadcrumbHint) => void): void;

  /**
   * Register a callback before a breadcrumb is added.
   */
  on(hook: 'beforeAddBreadcrumb', callback: (breadcrumb: Breadcrumb, hint?: BreadcrumbHint) => void): void;

  /**
   * Register a callback when a DSC (Dynamic Sampling Context) is created.
   */
  on(hook: 'createDsc', callback: (dsc: DynamicSamplingContext, rootSpan?: Span) => void): void;

  /**
   * Register a callback when a Feedback event has been prepared.
   * This should be used to mutate the event. The options argument can hint
   * about what kind of mutation it expects.
   */
  on(
    hook: 'beforeSendFeedback',
    callback: (feedback: FeedbackEvent, options?: { includeReplay?: boolean }) => void,
  ): void;

  /**
   * A hook for the browser tracing integrations to trigger a span start for a page load.
   */
  on(
    hook: 'startPageLoadSpan',
    callback: (
      options: StartSpanOptions,
      traceOptions?: { sentryTrace?: string | undefined; baggage?: string | undefined },
    ) => void,
  ): void;

  /**
   * A hook for browser tracing integrations to trigger a span for a navigation.
   */
  on(hook: 'startNavigationSpan', callback: (options: StartSpanOptions) => void): void;

  /**
   * A hook that is called when the client is flushing
   */
  on(hook: 'flush', callback: () => void): void;

  /**
   * A hook that is called when the client is closing
   */
  on(hook: 'close', callback: () => void): void;

  /** Fire a hook whener a span starts. */
  emit(hook: 'spanStart', span: Span): void;

  /** A hook that is called every time before a span is sampled. */
  emit(
    hook: 'beforeSampling',
    samplingData: {
      spanAttributes: SpanAttributes;
      spanName: string;
      parentSampled?: boolean;
      parentContext?: SpanContextData;
    },
    samplingDecision: { decision: boolean },
  ): void;

  /** Fire a hook whener a span ends. */
  emit(hook: 'spanEnd', span: Span): void;

  /**
   * Fire a hook indicating that an idle span is allowed to auto finish.
   */
  emit(hook: 'idleSpanEnableAutoFinish', span: Span): void;

  /*
   * Fire a hook event for envelope creation and sending. Expects to be given an envelope as the
   * second argument.
   */
  emit(hook: 'beforeEnvelope', envelope: Envelope): void;

  /**
   * Fire a hook event before sending an event.
   * This is called right before an event is sent and should not be used to mutate the event.
   * Expects to be given an Event & EventHint as the second/third argument.
   */
  emit(hook: 'beforeSendEvent', event: Event, hint?: EventHint): void;

  /**
   * Fire a hook event to process events before they are passed to (global) event processors.
   * Expects to be given an Event & EventHint as the second/third argument.
   */
  emit(hook: 'preprocessEvent', event: Event, hint?: EventHint): void;

  /*
   * Fire a hook event after sending an event. Expects to be given an Event as the
   * second argument.
   */
  emit(hook: 'afterSendEvent', event: Event, sendResponse: TransportMakeRequestResponse): void;

  /**
   * Fire a hook for when a breadcrumb to be added. This can be used by the SDK before user finalizes the breadcrumb
   * in `beforeBreadcrumb` callback. This is used in SDK which require different handling of breadcrumbs like RN, Capacitor...
   */
  emit(hook: 'preprocessAddBreadcrumb', breadcrumb: Breadcrumb, hint?: BreadcrumbHint): void;

  /**
   * Fire a hook for when a breadcrumb is added. Expects the breadcrumb as second argument.
   */
  emit(hook: 'beforeAddBreadcrumb', breadcrumb: Breadcrumb, hint?: BreadcrumbHint): void;

  /**
   * Fire a hook for when a DSC (Dynamic Sampling Context) is created. Expects the DSC as second argument.
   */
  emit(hook: 'createDsc', dsc: DynamicSamplingContext, rootSpan?: Span): void;

  /**
   * Fire a hook event for after preparing a feedback event. Events to be given
   * a feedback event as the second argument, and an optional options object as
   * third argument.
   */
  emit(hook: 'beforeSendFeedback', feedback: FeedbackEvent, options?: { includeReplay?: boolean }): void;

  /**
   * Emit a hook event for browser tracing integrations to trigger a span start for a page load.
   */
  emit(
    hook: 'startPageLoadSpan',
    options: StartSpanOptions,
    traceOptions?: { sentryTrace?: string | undefined; baggage?: string | undefined },
  ): void;

  /**
   * Emit a hook event for browser tracing integrations to trigger a span for a navigation.
   */
  emit(hook: 'startNavigationSpan', options: StartSpanOptions): void;

  /**
   * Emit a hook event for client flush
   */
  emit(hook: 'flush'): void;

  /**
   * Emit a hook event for client close
   */
  emit(hook: 'close'): void;

  /* eslint-enable @typescript-eslint/unified-signatures */
}
