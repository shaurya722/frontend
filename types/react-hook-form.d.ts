// Type declaration to fix React 19 compatibility issue with react-hook-form
// This re-exports all types and values from the actual react-hook-form package
declare module 'react-hook-form' {
  export {
    Controller,
    FormProvider,
    Watch,
    useController,
    useFieldArray,
    useForm,
    useFormContext,
    useFormState,
    useWatch,
    appendErrors,
    createFormControl,
    get,
    set,
  } from 'react-hook-form/dist/index'
  
  export type {
    ControllerProps,
    FieldPath,
    FieldValues,
    UseControllerProps,
    UseControllerReturn,
    UseFormProps,
    UseFormReturn,
    UseFormContextReturn,
    UseFormStateProps,
    UseFormStateReturn,
    UseFieldArrayProps,
    UseFieldArrayReturn,
    UseWatchProps,
  } from 'react-hook-form/dist/types'
}

