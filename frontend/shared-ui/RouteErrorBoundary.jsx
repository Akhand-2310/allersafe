import { Component } from 'react';

export class RouteErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.error('Route render error:', error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <div className="panel page-shell error-box" role="alert">
        <div>
          <h2>AI Assistant could not load</h2>
          <p>Please try opening this section again.</p>
          <small>{this.state.error?.message || 'Unknown render error.'}</small>
          <button type="button" className="primary-button" onClick={this.reset}>Reload Assistant</button>
        </div>
      </div>;
    }

    return this.props.children;
  }
}
