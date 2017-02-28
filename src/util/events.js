
    // Bind an outside event that only calls the handler if the event doesn't occur
    // on jquery_obj or one of its children.
    //
    // NOTE: unbind_outside_event must be called to unbind the event; it will cause a
    // memory leak if it isn't
    exports.bind_outside_event = function(event_name, namespace, jquery_obj, handler, context) { // jshint ignore:line
        if (context) {
            handler = _.bind(handler, context);
        }

        $(document).on(event_name + '.' + namespace + '.' + 'OUTSIDE_EVENT', function(e) {
            if (jquery_obj.length && !$(jquery_obj).is(e.target) && !$.contains(jquery_obj[0], e.target) && $.contains(document, e.target)) {
                handler(e);
            }
        });
    };

    // Unbind an outside event
    exports.unbind_outside_event = function(event_name, namespace) {
       $(document).off(event_name + '.' + namespace + '.' + 'OUTSIDE_EVENT');
    };
