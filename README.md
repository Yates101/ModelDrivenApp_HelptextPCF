## Help Text PCF

A PCF control based on displaying help text stored in a dataverse table, that dynamically updates based upon the selected field in the form.

This PCF functions by adding an event listener to each field on a form. That event listener then creates a custom event which communicates the logical name of the field to the PCF.
The PCF then fetches the related text from a dataverse table and renders it within a dynamically resizing container.

## How to use the control

To use this control, carry out the following steps within your target environment:
 - First you must create a table within your dataverse environment, named 'Help Text'. (Leaving the primary column as 'Name')
 - Add the following columns to the table:
    - 'Related Field' - Single line of text
    - 'Text' - Multiple lines of text
 - On the target entity (related to the form), add a column named 'Help Text'
 - Then import the PCF solution to your target environment
 - Create a new section on the target form and add the help text field, adding the help text PCF as a custom control
 - Provide the publisher prefix for the target environment (you must ensure all above columns and tables use the same prefix), as well as placeholder information for fields where help text is not provided.
 - Populate your help text table with a header (name) body (text) and the logical name of the related field (related field) for each field on the form you wish to dipsplay help text on.