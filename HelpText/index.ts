// import { HelpText, IHelpTextProps } from "./HelpText";
import { IInputs, IOutputs } from "./generated/ManifestTypes";

interface EventListener {
    (evt: Event): void;
}

export class HelpText implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _notifyOutputChanged: () => void;
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;

    // Logical name of selected field, used to look up related helptext
    private _fieldLogicalName: string;
    // Title to be displayed above helptext
    private helpTextHeader: HTMLElement;
    // Help text to be displayed
    private helpText: HTMLElement;

    constructor() { }

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        // Control initialization code
        this._context = context;
        this._container = document.createElement("div");
        this._notifyOutputChanged = notifyOutputChanged;
        // Used to make the content of the PCF dynamic, based on the resizing of the container
        context.mode.trackContainerResize(true);

        // Add event listener to the window to pick up the return message of the event listeners added to fields and pass to the event handler function
        window.addEventListener('onSelectField', ((event: CustomEvent) => {
            const message = event.detail;

            console.log(message, 'message recieved by PCF')

            this.formFieldSelected(message.Field);
        }) as EventListener)

        // Add event listeners to the form fields to register the selection

        // Only generated form field container divs have this tag
        const formFields = document.querySelectorAll("div[data-control-name]")
        // Create custome event that will be registered by PCF's event listener
        formFields.forEach(
            (div) => {
                console.log(div, 'div found')
                div.addEventListener("click", () => {
                    console.log('clicked', div)
                    const event = new CustomEvent("onSelectField", {
                        detail: {
                            Field: div.getAttribute("data-control-name")
                        }
                    });
                    window.dispatchEvent(event);
                });
            }
        );
        
        // Assign placeholder text
        let placeHolderHeader = "";
        let placeHolderText = "";

		if (context.parameters.PlaceHolderHeader.raw != null) {
			placeHolderHeader  = placeHolderHeader + context.parameters.PlaceHolderHeader.raw;
        } else {
            placeHolderHeader  = placeHolderHeader + "Help Text";
        }
        if (context.parameters.PlaceHolderText.raw != null) {
			placeHolderText  = placeHolderText + context.parameters.PlaceHolderText.raw;
        } else {
			placeHolderText  = placeHolderText + "Please select a field to display the related help text below.";
        }
            // Create HTML elements (with classes for css styling)
        this.helpTextHeader = document.createElement("h1");
        this.helpText = document.createElement("p");

        // Combine text and elements and append to the container
        this.helpTextHeader.innerText = placeHolderHeader;
        this.helpText.innerText = placeHolderText;
        container.appendChild(this.helpTextHeader);
        container.appendChild(this.helpText);
    }

    public formFieldSelected(fieldName: string): void {
        console.log('formFielSelected triggered', fieldName)

        this.helpTextHeader.innerText = fieldName;
        this.helpText.innerText = `${fieldName} related helptext`
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const width: number = parseInt(context.mode.allocatedWidth.toString());
        const height: number = parseInt(context.mode.allocatedHeight.toString());

    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
