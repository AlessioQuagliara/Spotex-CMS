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
            $hasCodePayload = is_string($this->input('html'))
                || is_string($this->input('css'))
                || is_string($this->input('js'));

            if (!is_array($document) && !is_array($elements) && !$hasCodePayload) {
                $validator->errors()->add('document', 'document or elements (or html/css/js) is required');
                return;
            }

            if (is_array($document) && !$this->isGrapesPayload($document)) {
                $errors = app(BuilderDocumentValidator::class)->validate($document);

                foreach ($errors as $error) {
                    $validator->errors()->add('document', $error);
                }
            }
        });
    }

    private function isGrapesPayload(mixed $document): bool
    {
        $schemaVersion = (string) $this->input('schema_version', '');

        if (str_starts_with($schemaVersion, 'grapesjs')) {
            return true;
        }

        if (!is_array($document)) {
            return false;
        }

        if (($document['type'] ?? null) === 'grapesjs') {
            return true;
        }

        return isset($document['projectData']) || isset($document['pages']) || isset($document['styles']) || isset($document['assets']);
    }
}
