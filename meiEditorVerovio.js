require(['meiEditor'], function(){
(function ($)
{
    window.meiEditorPlugins.push((function()
    {
        var retval = 
        {
            init: function(meiEditor, meiEditorSettings)
            {
                if (!("verovioInstance" in meiEditorSettings))
                {
                    console.error("MEI Editor error: The 'VerovioEditor' plugin requires the 'verivioInstance' setting present on intialization.");
                    return false;
                }

                meiEditor.addToNavbar("Verovio", "verovio");
                $("#dropdown-verovio").append("<li><a id='update-verovio'>Update Verovio</a></li>");
                $("#dropdown-verovio").append("<li><a id='critical-note-mus'>Add Critical Note Music</a></li>");
                $("#dropdown-verovio").append("<li><a id='critical-note-lyr'>Add Critical Note Lyrics</a></li>");
                    //"<li><a id='update-dropdown'>Automatically update:<span style='float:right'><input type='checkbox' id='updateBox' checked='checked'/></span></a></li>");
                
                $("#update-verovio").on('click', function()
                {
                    $("#updateVerovioModal").modal();
                });

                $("#critical-note-mus").on('click', function()
                {
                    var ids = meiEditorSettings.verovioInstance.getHighlightedNote();
                    if (ids.length == 1) 
                        var id = ids[0];
                    else return;

                    var pageTitle = meiEditor.getActivePageTitle();
                    var rootNode = meiEditor.getPageData(pageTitle).parsed;
                    var note = rootNode.querySelector("note[*|id=" + id);
                    var staff = note.closest("staff");
                    var measure = note.closest("measure");

                    var newAnnot = rootNode.createElement("annot");
                    newAnnot.setAttribute("label", "app");
                    newAnnot.setAttribute("source", "");
                    newAnnot.setAttribute("plist", id);
                    newText = rootNode.createTextNode("critical note");
                    newAnnot.appendChild(newText);
                    measure.appendChild(newAnnot);

                    var editorRef = meiEditor.getPageData(pageTitle);
                    rewriteAce(editorRef);

                    meiEditorSettings.verovioInstance.resetIDArrays();
                });

                $("#critical-note-lyr").on('click', function()
                {
                    var id_cache = meiEditorSettings.verovioInstance.getHighlightedLyrics();                    
                    var firstNote = false;
                    var tabs;
                    var pageTitle = meiEditor.getActivePageTitle();
                    var rootNode = meiEditor.getPageData(pageTitle).parsed;
                    var meiNode = rootNode.querySelector("mei");

                    // if there is not already a main <annot> element, add it            
                    if (rootNode.querySelector('annot[label="app-text"]') == null)
                    {
                        var annotMain = rootNode.createElement("annot");
                        annotMain.setAttribute("label", "app-text");
                        meiNode.appendChild(annotMain);
                        addTabs(annotMain, meiNode, "before");
                        $(annotMain).prepend("\n");                    
                        $(annotMain).after("\n");
                        firstNote = true;
                    }
                    else
                    {
                        var annotMain = rootNode.querySelector('annot[label="app-text"]');
                    }

                    var newAnnot = rootNode.createElement("annot");
                    newAnnot.setAttribute("label", "");
                    if (firstNote)
                    {
                        annotMain.appendChild(newAnnot);
                        $(newAnnot).after("\n");
                        addTabs(annotMain, meiNode, "append");
                    }
                    else
                    {
                        var prevChildren = annotMain.childNodes;
                        annotMain.insertBefore(newAnnot, prevChildren[prevChildren.length-1]);
                        $(newAnnot).before("\n");
                    }

                    var newList = rootNode.createElement("list");
                    var newLi = rootNode.createElement("li");
                    var newText = rootNode.createTextNode("lyric");
                    newLi.appendChild(newText);
                    newList.appendChild(newLi);
                    newAnnot.appendChild(newList);
                    var childAnnot = rootNode.createElement("annot");
                    childAnnot.setAttribute("plist", id_cache);
                    var childText = rootNode.createTextNode("voice info");
                    childAnnot.appendChild(childText);
                    newAnnot.appendChild(childAnnot);

                    addTabs(newAnnot, meiNode, "before");
                    $(newAnnot).prepend("\n");
                    addTabs(newList, meiNode, "before");
                    $(newList).prepend("\n");
                    addTabs(newLi, meiNode, "before");
                    $(newList).append("\n");
                    addTabs(newList, meiNode, "append");
                    $(childAnnot).before("\n");
                    addTabs(childAnnot, meiNode, "before");
                    $(childAnnot).after("\n");
                    addTabs(newAnnot, meiNode, "append");

                    var editorRef = meiEditor.getPageData(pageTitle);
                    rewriteAce(editorRef);

                    meiEditorSettings.verovioInstance.resetIDArrays();
                });

                function addTabs(node, topNode, loc)
                {
                    var count = 0;
                    var curNode = node;
                    while (curNode != topNode)
                    {
                        curNode = curNode.parentNode;
                        count++;
                    }
                    switch (loc)
                    {
                        case "before":
                            for (var i = 0; i < count; i++)
                                $(node).before("\t");
                            break;

                        case "after":
                            for (var i = 0; i < count; i++)
                                $(node).after("\t");
                            break;

                        case "prepend":
                            for (var i = 0; i < count; i++)
                                $(node).prepend("\t");
                            break;

                        case "append":
                            for (var i = 0; i < count; i++)
                                $(node).append("\t");
                            break;
                    }
                }

                createModal(meiEditorSettings.element, 'updateVerovioModal', false, 
                    '<h4>Push a file to Verovio:</h4>' +
                    createSelect("Verovio", meiEditor.getPageTitles()), 'Submit');

                var recallID;

                var updateVerovio = function(pageName)
                {
                    if(pageName === undefined)
                    {
                        pageName = meiEditor.getActivePageTitle();
                    }

                    formatToSave = function(lineIn, indexIn)
                    {          
                        if (lineIn !== "") //if the line's not blank (nothing in MEI should be)
                        {
                            formattedData[indexIn] = lineIn + "\n"; //add a newline - it doesn't use them otherwise. Last line will have a newline but this won't stack when pages are re-uploaded as this also removes blank lines.
                        }
                    };
                    
                    var formattedData = meiEditor.getPageData(pageName).getSession().doc.getAllLines().join("\n"); //0-indexed

                    meiEditorSettings.verovioInstance.changeMusic(formattedData);
                };

                $("#updateVerovioModal-primary").on('click', function()
                {
                    
                    var pageName = $("#selectVerovio").find(":selected").text();
                    updateVerovio(pageName);
                    $("#updateVerovioModal-close").trigger('click');
                });

                meiEditor.events.subscribe("NewFile", function(a, fileName)
                {
                    $("#selectVerovio").append("<option name='" + fileName + "'>" + fileName + "</option>");
                    updateVerovio();
                });

                mei.Events.subscribe("VerovioUpdated", function(newMei)
                {
                    if(newMei === undefined) return;
                    var pageTitle = meiEditor.getActivePageTitle();
                    var editorRef = meiEditor.getPageData(pageTitle);
                    editorRef.parsed = meiParser.parseFromString(newMei, 'text/xml');

                    rewriteAce(editorRef);

                    if (recallID) 
                    {
                        meiEditor.gotoLineWithID(recallID);
                    }
                });

                mei.Events.subscribe("HighlightSelected", function(id)
                {
                    meiEditor.gotoLineWithID(id);
                    recallID = id;
                });

                meiEditor.edit = function(editorAction)
                {
                    meiEditorSettings.verovioInstance.edit(editorAction);
                };

                meiEditor.updateMEI = function()
                {
                    var mei = meiEditorSettings.verovioInstance.getMei();
                };

                return true;
            }
        };

        return retval;
    })());

    window.pluginLoader.pluginLoaded();

})(jQuery);

});