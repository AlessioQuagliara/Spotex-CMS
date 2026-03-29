import React from 'react';
import CraftEditorShell from './craft/CraftEditorShell';
import './styles/builder.css';

export default function BuilderApp(props) {
    return <CraftEditorShell {...props} />;
}
