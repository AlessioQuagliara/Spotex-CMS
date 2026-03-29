<?php

namespace App\Http\Requests;

use App\Services\Builder\BuilderDocumentValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SavePageBuilderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'schema_version' => ['nullable', 'string', 'max:32'],
            'document' => ['nullable', 'array'],
            'elements' => ['nullable', 'array'],
            'modules' => ['nullable', 'array'],
            'meta' => ['nullable', 'array'],
            'html' => ['nullable', 'string'],
            'css' => ['nullable', 'string'],
            'js' => ['nullable', 'string'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $document = $this->input('document');
            $elements = $this->input('elements');

            if (!is_array($document) && !is_array($elements)) {
                $validator->errors()->add('document', 'document or elements is required');
                return;
            }

            if (is_array($document)) {
                $errors = app(BuilderDocumentValidator::class)->validate($document);

                foreach ($errors as $error) {
                    $validator->errors()->add('document', $error);
                }
            }
        });
    }
}
