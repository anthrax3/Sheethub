/*
    Sheethub, the CSS backdoor API

    Version     : 0.4.2
    Author      : Aurélien Delogu (dev@dreamysource.fr)
    Homepage    : https://github.com/pyrsmk/Sheethub
    License     : MIT
    
    O.5.O
        [ ] do NOT retrieve all stylesheets at start but get it when needed
        [ ] Stylesheet.init(url): download the stylesheet even it doesn't exist as node
*/

this.Sheethub=function(){
    
    var doc=document,
        getElementsByTagName='getElementsByTagName',
        head=doc[getElementsByTagName]('head')[0],
        removeChild='removeChild',
        parentNode='parentNode',
        stylesheets={},
        ready=false,
        listeners=[],
        sheetsToLoad=0,
        node,
        nodes=[],
        links=doc[getElementsByTagName]('link'),
        styles=doc[getElementsByTagName]('style'),
        a,
        b,
        callback=function(){
            if(!--sheetsToLoad){
                ready=true;
                var i=listeners.length;
                while(i){
                    listeners[--i]();
                }
            }
        },
    
    /*========================================================================
        Stylesheet object
    ========================================================================*/
    
    /*
        Create a new stylesheet

        Parameters
            Object, string contents: a LINK node, a STYLE node or CSS rules
    */
    Stylesheet=function(contents){

        var node,
            ready=false,
            listeners=[],
            appendChild='appendChild',
            styleSheet='styleSheet',
            a,

        /*
            Create a new STYLE node
        */
        createNewNode=function(){
            head[appendChild](node=doc.createElement('style'));
            // IE doesn't support creating a text node into a STYLE block
            if(!node[styleSheet]){
                node[appendChild](doc.createTextNode(''));
            }
        },
        
        /*
            Stylesheet is now considered as ready
        */
        complete=function(){
            ready=true;
            a=listeners.length;
            while(a){
                listeners[--a]();
            }
        },

        Stylesheet={
            
            /*
                Add a listener
                
                Parameters
                    Function callback
            */
            listen:function(callback){
                listeners.push(callback);
            },

            /*
                Verify init state

                Return
                    boolean
            */
            ready:function(){
                return ready;
            },

            /*
                Set stylesheet contents
                
                Parameters
                    string contents
            */
            set:function(contents){
                // Convert linked to embedded node
                if(node.tagName=='LINK'){
                    node[parentNode][removeChild](node);
                    createNewNode();
                }
                // IE
                if(node[styleSheet]){
                    node[styleSheet].cssText=contents;
                }
                // Other browsers
                else{
                    // innerHTML fails on Safari 3/4 and perhaps other browsers
                    node.firstChild.nodeValue=contents;
                }
            },
            
            /*
                Get stylesheet contents
                
                Return
                    string
            */
            get:function(contents){
                // IE
                if(node[styleSheet]){
                    return node[styleSheet].cssText;
                }
                // Other browsers
                else{
                    return node.innerHTML;
                }
            },

            /*
                Return the stylesheet node

                Return
                    Object
            */
            node:function(){
                return node;
            }
        
        },

        /*---------------------------------
            Initialize the stylesheet
        ---------------------------------*/
        
        isDOMReady=function(){
            if(head){
                if(typeof contents=='object'){
                    // Set node
                    node=contents;
                    // Retrieve LINK stylesheet
                    if(node.tagName=='LINK'){
                        // Retrieve XHR object
                        if(this.XMLHttpRequest){
                            a=new XMLHttpRequest();
                        }
                        else{
                            a=new ActiveXObject('Microsoft.XMLHTTP');
                        }
                        // Create ajax request
                        a.open('GET',node.href,true);
                        a.onreadystatechange=function(){
                            if(a.readyState==4){
                                // Change CSS scope and update contents
                                Stylesheet.set(a.responseText.replace(/\.\.\//g,''));
                                // Load complete
                                complete();
                            }
                        };
                        a.send(null);
                    }
                }
                else{
                    createNewNode();
                    if(typeof contents=='string'){
                        Stylesheet.set(contents);
                    }
                    complete();
                }
            }
            else{
                setTimeout(isDOMReady,250);
            }
        };
        
        isDOMReady();
        
        return Stylesheet;

    },
    
    /*========================================================================
        Sheethub object
    ========================================================================*/
    
    Sheethub={
    
        /*
            Add a listener
            
            Parameters
                Function callback
        */
        listen:function(callback){
            listeners.push(callback);
        },

        /*
            Verify the init state

            Return
                boolean
        */
        ready:function(){
            return ready;
        },

        /*
            Verify if a stylesheet exists

            Parameters
                string id: stylesheet id

            Return
                boolean
        */
        has:function(id){
            return stylesheets[id];
        },

        /*
            Create a new stylesheet

            Parameters
                string id               : stylesheet id
                Object, string contents : a LINK or STYLE node or CSS contents, otherwise create a empty STYLE node
        */
        add:function(id,contents){
            if(!Sheethub.has(id)){
                stylesheets[id]=new Stylesheet(contents);
            }
        },

        /*
            Get one stylesheet or all

            Parameters
                string id   : stylesheet id

            Return
                Stylesheet
        */
        get:function(id){
            if(!id){
                return stylesheets;
            }
            if(Sheethub.has(id)){
                return stylesheets[id];
            }
        },

        /*
            Remove a stylesheet

            Parameters
                string id   : stylesheet id
        */
        remove:function(id){
            if(Sheethub.has(id)){
                a=stylesheets[id].node();
                a[parentNode][removeChild](a);
                delete stylesheets[id];
            }
        }
    
    };

    /*---------------------------------
        Initialize the whole stuff
    ---------------------------------*/

    // Get linked stylesheets
    a=-1;
    while(b=links[++a]){
        if(b.rel!='icon'){
            nodes.push(b);
            // One more to load!
            ++sheetsToLoad;
        }
    }
    // Get embedded stylesheets
    a=styles.length;
    while(a){
        nodes.push(styles[--a]);
    }
    // Create Stylesheet objects
    a=-1;
    while(node=nodes[++a]){
        // Get the stylesheet name
        if(!(b=node.title) && node.href){
            b=node.href.match(/([^\/]+)\.css$/)[1];
        }
        // Add the stylesheet
        Sheethub.add(b,node);
        // Watch the load state
        if(stylesheets[b].ready()){
            callback();
        }
        else{
            stylesheets[b].listen(callback);
        }
    }
    return Sheethub;

}();
