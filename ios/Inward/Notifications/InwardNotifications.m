// Objective-C bridge for the Swift module (classic NativeModules surface).
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(InwardNotifications, NSObject)

RCT_EXTERN_METHOD(scheduleDaily:(NSString *)slot
                  hour:(nonnull NSNumber *)hour
                  minute:(nonnull NSNumber *)minute
                  line:(NSString *)line
                  sound:(BOOL)sound
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancel:(NSString *)slot
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
