/**
 * Basic LaunchDarkly JavaScript client interfaces, shared between the browser SDK and the Electron SDK.
 *
 * Documentation: http://docs.launchdarkly.com/docs/js-sdk-reference
 */
declare module 'ldclient-js-common' {
  export const version: string;

  /**
   * The types of values a feature flag can have.
   *
   * Flags can have any JSON-serializable value.
   */
  export type LDFlagValue = any;

  /**
   * A map of feature flags from their keys to their values.
   */
  export type LDFlagSet = {
    [key: string]: LDFlagValue;
  };

  /**
   * A map of feature flag keys to objects holding changes in their values.
   */
  export type LDFlagChangeset = {
    [key: string]: {
      current: LDFlagValue;
      previous: LDFlagValue;
    };
  };

  /**
   * The parameters required to (un)subscribe to/from LaunchDarkly events. See
   * LDClient#on and LDClient#off.
   *
   * The following event names (keys) are used by the cliet:
   *
   * "ready": The client has finished starting up. This event will be sent regardless
   * of whether it successfully connected to LaunchDarkly, or encountered an error
   * and had to give up; to distinguish between these cases, see below.
   *
   * "initialized": The client successfully started up and has valid feature flag
   * data. This will always be accompanied by "ready".
   *
   * "failed": The client encountered an error that prevented it from connecting to
   * LaunchDarkly, such as an invalid environment ID. All flag evaluations will
   * therefore receive default values. This will always be accompanied by "ready".
   *
   * "error": General event for any kind of error condition during client operation.
   * The callback parameter is an Error object. If you do not listen for "error"
   * events, then the errors will be logged with console.log().
   *
   * "change": The client has received new feature flag data. This can happen either
   * because you have switched users with identify(), or because the client has a
   * stream connection and has received a live change to a flag value (see below).
   * The callback  parameter is an LDFlagChangeset.
   *
   * "change:FLAG-KEY": The client has received a new value for a specific flag
   * whose key is FLAG-KEY. The callback receives two parameters: the current (new)
   * flag value, and the previous value. This is always accompanied by a general
   * "change" event as described above; you can listen for either or both.
   *
   * The "change" and "change:FLAG-KEY" events have special behavior: by default, the
   * client will open a streaming connection to receive live changes if and only if
   * you are listening for one of these events. This behavior can be overridden by
   * setting LDOptions.streaming or calling LDClient.setStreaming().
   */
  type LDEventSignature = (
    key: string,
    callback: (current?: LDFlagValue | LDFlagChangeset, previous?: LDFlagValue) => void,
    context?: any
  ) => void;

  /**
   * The minimal interface for any object that LDClient can use for logging. The client uses
   * four log levels, with "error" being the most severe. Each corresponding logger method
   * takes a single string parameter. The logger implementation is responsible for deciding
   * whether to produce output or not based on the level.
   */
  export interface LDLogger {
    debug: (message: string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  }

  /**
   * A basic implementation of logging that uses the global "console" object. This is used by
   * default in the browser SDK. It sends messages of "debug", "info", "warn", or "error"
   * level (if enable) to console.log(), console.info(), console.warn(), and console.error()
   * respectively.
   *
   * To make LDClient use this logger, put it in the "logger" property of LDOptions.
   */
  export const createConsoleLogger: (minimumLevel: string) => LDLogger;

  /**
   * LaunchDarkly initialization options that are supported by all variants of the JS client.
   * The browser SDK and Electron SDK may support additional options.
   */
  export interface LDOptionsBase {
    /**
     * An object that will perform logging for the client. If not specified, the default is
     * createConsoleLogger() in the browser SDK, or a logger from the winston package in Electron.
     */
    logger?: LDLogger;

    /**
     * The initial set of flags to use until the remote set is retrieved.
     *
     * If "localStorage" is specified, the flags will be saved and
     * retrieved from browser local storage. Alternatively, an LDFlagSet can
     * be specified which will be used as the initial source of flag values.
     */
    bootstrap?: 'localStorage' | LDFlagSet;

    /**
     * The base url for the LaunchDarkly server.
     *
     * This is used for enterprise customers with their own LaunchDarkly instances.
     * Most users should use the default value.
     *
     */
    baseUrl?: string;

    /**
     * The url for the LaunchDarkly events server.
     *
     * This is used for enterprise customers with their own LaunchDarkly instances.
     * Most users should use the default value.
     *
     */
    eventsUrl?: string;

    /**
     * The url for the LaunchDarkly stream server.
     *
     * This is used for enterprise customers with their own LaunchDarkly instances.
     * Most users should use the default value.
     *
     */
    streamUrl?: string;

    /**
     * Whether or not to open a streaming connection to LaunchDarkly for live flag updates.
     *
     * If this is true, the client will always attempt to maintain a streaming connection; if false,
     * it never will. If you leave the value undefined (the default), the client will open a streaming
     * connection if you subscribe to "change" or "change:flag-key" events (see LDClient.on()).
     *
     * This is equivalent to calling client.setStreaming() with the same value.
     */
    streaming?: boolean;

    /**
     * Whether or not to use the REPORT verb to fetch flag settings.
     *
     * If useReport is true, flag settings will be fetched with a REPORT request
     * including a JSON entity body with the user object.
     *
     * Otherwise (by default) a GET request will be issued with the user passed as
     * a base64 URL-encoded path parameter.
     *
     * Do not use unless advised by LaunchDarkly.
     */
    useReport?: boolean;

    /**
     * Whether or not to include custom HTTP headers when requesting flags from LaunchDarkly;
     * currently these are used to track what version of the SDK is active. This defaults to true
     * (custom headers will be sent). One reason you might want to set it to false is that the presence
     * of custom headers causes browsers to make an extra OPTIONS request (a CORS preflight check)
     * before each flag request, which could affect performance.
     */
    sendLDHeaders?: boolean;

    /**
     * True if you want LaunchDarkly to provide additional information about how
     * flag values were calculated, which is then available through the client's
     * variationDetail() method. Since this increases the size of network requests,
     * such information is not sent unless you request it with this option.
     */
    evaluationReasons?: boolean;

    /**
     * True (the default) if the client should send analytics events to LaunchDarkly.
     * Set it to false if you are not using analytics events.
     */
    sendEvents?: boolean;
    
    /**
     * Whether all user attributes (except the user key) should be marked as
     * private, and not sent to LaunchDarkly.
     *
     * Defaults to false.
     */
    allAttributesPrivate?: boolean;

    /**
     * The names of user attributes that should be marked as private, and not sent
     * to LaunchDarkly.
     *
     * Must be a list of strings. Defaults to empty list.
     */
    privateAttributeNames?: Array<string>;

    /**
     * Whether or not to send an analytics event for a flag evaluation even if the same flag was
     * evaluated with the same value within the last five minutes. This defaults to false (duplicate
     * events within five minutes will be dropped).
     */
    allowFrequentDuplicateEvents?: boolean;

    /**
     * Whether analytics events should be sent only when you call variation (true), or also when you
     * call allFlags (false). This defaults to false (events will be sent in both cases).
     */
    sendEventsOnlyForVariation?: boolean;

    /**
     * How long (in milliseconds) to collect analytics events before sending them in a batch to
     * LaunchDarkly. The default is 2000ms.
     */
    flushInterval?: number;

    /**
     * If specified, enables event sampling so that only some fraction of analytics events will be
     * sent pseudo-randomly. When set to greater than zero, there is a 1 in samplingInterval chance 
     * that events will be will be sent; for example, a value of 20 means that on average 1 in 20,
     * or 5%, of all events will be sent.
     */
    samplingInterval?: number;

    /**
     * How long (in milliseconds) to wait after a failure of the stream connection before trying to
     * reconnect. This only applies if streaming has been enabled by setting "streaming" to true or
     * subscribing for "change" events. The default is 1000ms.
     */
    streamReconnectDelay?: number;
  }

  /**
   * A LaunchDarkly user object.
   */
  export interface LDUser {
    /**
     * A unique string identifying a user.
     */
    key: string;

    /**
     * The user's name.
     *
     * You can search for users on the User page by name.
     */
    name?: string;

    /**
     * The user's first name.
     */
    firstName?: string;

    /**
     * The user's last name.
     */
    lastName?: string;

    /**
     * The user's email address.
     *
     * If an `avatar` URL is not provided, LaunchDarkly will use Gravatar
     * to try to display an avatar for the user on the Users page.
     */
    email?: string;

    /**
     * An absolute URL to an avatar image for the user.
     */
    avatar?: string;

    /**
     * The user's IP address.
     */
    ip?: string;

    /**
     * The country associated with the user.
     */
    country?: string;

    /**
     * Whether to show the user on the Users page in LaunchDarkly.
     */
    anonymous?: boolean;

    /**
     * Any additional attributes associated with the user.
     */
    custom?: {
      [key: string]: string | boolean | number | Array<string | boolean | number>;
    };
  }

  /**
   * Describes the reason that a flag evaluation produced a particular value. This is
   * part of the LDEvaluationDetail object returned by variationDetail().
   */
  export type LDEvaluationReason = {
    /**
     * The general category of the reason:
     *
     * 'OFF': the flag was off and therefore returned its configured off value
     *
     * 'FALLTHROUGH': the flag was on but the user did not match any targets or rules
     *
     * 'TARGET_MATCH': the user key was specifically targeted for this flag
     *
     * 'RULE_MATCH': the user matched one of the flag's rules
     *
     * 'PREREQUISITE_FAILED': the flag was considered off because it had at least one
     * prerequisite flag that either was off or did not return the desired variation
     *
     * 'ERROR': the flag could not be evaluated, e.g. because it does not exist or due
     * to an unexpected error
     */
    kind: string;

    /**
     * A further description of the error condition, if the kind was 'ERROR'.
     */
    errorKind?: string;

    /**
     * The index of the matched rule (0 for the first), if the kind was 'RULE_MATCH'.
     */
    ruleIndex?: number;

    /**
     * The unique identifier of the matched rule, if the kind was 'RULE_MATCH'.
     */
    ruleId?: string;

    /**
     * The key of the failed prerequisite flag, if the kind was 'PREREQUISITE_FAILED'.
     */
    prerequisiteKey?: string;
  };

  /**
   * An object returned by LDClient.variationDetail(), combining the result of a feature flag
   * evaluation with information about how it was calculated.
   */
  export type LDEvaluationDetail = {
    /**
     * The result of the flag evaluation. This will be either one of the flag's variations or
     * the default value that was passed to variationDetail().
     */
    value: LDFlagValue;

    /**
     * The index of the returned value within the flag's list of variations, e.g. 0 for the
     * first variation - or null if the default value was returned.
     */
    variationIndex?: number;

    /**
     * An object describing the main factor that influenced the flag evaluation value.
     * This will be null if you did not specify "explanationReasons: true" in your configuration.
     */
    reason: LDEvaluationReason;
  };

  /**
   * The basic interface for the LaunchDarkly client. The browser SDK and the Electron SDK both
   * use this, but may add some methods of their own.
   *
   * @see http://docs.launchdarkly.com/docs/js-sdk-reference
   */
  export interface LDClientBase {
    /**
     * Allows you to wait for client initialization using Promise syntax. The returned
     * Promise will be resolved once the client has either successfully initialized or
     * failed to initialize (e.g. due to an invalid environment key or a server error).
     * 
     * If you want to distinguish between these success and failure conditions, use
     * waitForInitialization() instead.
     * 
     * If you prefer to use event handlers rather than Promises, you can listen on the
     * client for a "ready" event.
     * 
     * @returns a Promise containing the initialization state of the client
     */
    waitUntilReady: () => Promise<void>;

    /**
     * Allows you to wait for client initialization using Promise syntax. The returned
     * Promise will be resolved if the client successfully initializes, or rejected (with
     * an error object) if it fails to initialize (e.g. due to an invalid environment key
     * or a server error). This is different from waitUntilReady(), which resolves the
     * Promise in either case.
     * 
     * If you prefer to use event handlers rather than Promises, you can listen on the
     * client for the events "initialized" and "failed".
     * 
     * @returns a Promise containing the initialization state of the client
     */
    waitForInitialization: () => Promise<void>;

    /**
     * Identifies a user to LaunchDarkly.
     *
     * This only needs to be called if the user changes identities because
     * normally the user's identity is set during client initialization.
     *
     * @param user
     *   A map of user options. Must contain at least the `key` property
     *   which identifies the user.
     * @param hash
     *   The signed user key for Secure Mode; see
     *   http://docs.launchdarkly.com/docs/js-sdk-reference#secure-mode
     * @param onDone
     *   A callback to invoke after the user is identified.
     */
    identify: (user: LDUser, hash?: string, onDone?: (err: Error | null, flags: LDFlagSet | null) => void) => Promise<void>;

    /**
     * Returns the client's current user. This is the user that was most recently
     * passed to identify(), or, if identify() has never been called, the initial
     * user specified when the client was created.
     */
    getUser: () => LDUser;

    /**
     * Flushes pending events asynchronously.
     *
     * @param onDone
     *   A callback to invoke after the events were flushed.
     */
    flush: (onDone?: Function) => Promise<void>;

    /**
     * Retrieves a flag's value.
     *
     * @param key
     *   The key of the flag for which to retrieve the corresponding value.
     * @param defaultValue
     *   The value to use if the flag is not available (for example, if the
     *   user is offline or a flag is requested that does not exist).
     *
     * @returns
     *   The flag's value.
     */
    variation: (key: string, defaultValue?: LDFlagValue) => LDFlagValue;

    /**
     * Retrieves a flag's value, along with information about how it was calculated, in the form
     * of an LDEvaluationDetail object. Note that the "reason" property will only have a value
     * if you specified "evaluationExplanations: true" in your configuration.
     *
     * The reason property of the result will also be included in analytics events, if you are
     * capturing detailed event data for this flag.
     *
     * @param key
     *   The key of the flag for which to retrieve the corresponding value.
     * @param defaultValue
     *   The value to use if the flag is not available (for example, if the
     *   user is offline or a flag is requested that does not exist).
     *
     * @returns LDEvaluationDetail object containing the value and explanation.
     */
    variationDetail: (key: string, defaultValue?: LDFlagValue) => LDEvaluationDetail;

    /**
     * Specifies whether or not to open a streaming connection to LaunchDarkly for live flag updates.
     *
     * If this is true, the client will always attempt to maintain a streaming connection; if false,
     * it never will. If you leave the value undefined (the default), the client will open a streaming
     * connection if you subscribe to "change" or "change:flag-key" events (see LDClient.on()).
     *
     * This can also be set as the "streaming" property of the client options.
     */
    setStreaming: (value?: boolean) => void;

    /**
     * Registers an event listener. See LDEventSignature for the available event types
     * and the data that can be associated with them.
     *
     * @param key
     *   The name of the event for which to listen.
     * @param callback
     *   The function to execute when the event fires. The callback may or may not
     *   receive parameters, depending on the type of event; see LDEventSignature.
     * @param context
     *   The "this" context to use for the callback.
     */
    on: LDEventSignature;

    /**
     * Deregisters an event listener. See LDEventSignature for the available event types.
     *
     * @param key
     *   The name of the event for which to stop listening.
     * @param callback
     *   The function to deregister.
     * @param context
     *   The "this" context for the callback.
     */
    off: LDEventSignature;

    /**
     * Track page events to use in goals or A/B tests.
     *
     * LaunchDarkly automatically tracks pageviews and clicks that are
     * specified in the Goals section of their dashboard. This can be used
     * to track custom goals or other events that do not currently have
     * goals.
     *
     * @param key
     *   The event to record.
     * @param data
     *   Additional information to associate with the event.
     */
    track: (key: string, data?: any) => void;

    /**
     * Returns a map of all available flags to the current user's values.
     */
    allFlags: () => LDFlagSet;
  }
}