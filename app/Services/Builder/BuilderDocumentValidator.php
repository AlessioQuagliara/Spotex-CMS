<?php

namespace App\Services\Builder;

class BuilderDocumentValidator
{
    /**
     * @return list<string>
     */
    public function validate(array $document): array
    {
        $errors = [];

        if (!isset($document['ROOT']) || !is_array($document['ROOT'])) {
            return ['document.ROOT is required and must be an object'];
        }

        foreach ($document as $nodeId => $node) {
            if (!is_array($node)) {
                $errors[] = "document.$nodeId must be an object";
                continue;
            }

            if (!isset($node['type']) || !is_array($node['type'])) {
                $errors[] = "document.$nodeId.type is required and must be an object";
                continue;
            }

            if (!isset($node['type']['resolvedName']) || !is_string($node['type']['resolvedName'])) {
                $errors[] = "document.$nodeId.type.resolvedName is required";
            }

            if (isset($node['nodes']) && !is_array($node['nodes'])) {
                $errors[] = "document.$nodeId.nodes must be an array";
            }

            if (isset($node['linkedNodes']) && !is_array($node['linkedNodes'])) {
                $errors[] = "document.$nodeId.linkedNodes must be an object";
            }

            if (isset($node['props']) && !is_array($node['props'])) {
                $errors[] = "document.$nodeId.props must be an object";
            }

            if (isset($node['isCanvas']) && !is_bool($node['isCanvas'])) {
                $errors[] = "document.$nodeId.isCanvas must be a boolean";
            }
        }

        return $errors;
    }
}
