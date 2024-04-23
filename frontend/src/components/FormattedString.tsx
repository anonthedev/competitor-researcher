import React from 'react';

const FormattedInput = ({ input }: {input: string}) => {
  const formattedInput = JSON.parse(input.slice(27, -1));
  const observation = JSON.parse(formattedInput['Observation'].slice(11));

  return (
    <div className="formatted-input">
      <div className="section">
        <h3>Action</h3>
        <p>{formattedInput['Action']}</p>
      </div>
      <div className="section">
        <h3>Thought</h3>
        <p>{formattedInput['Thought']}</p>
      </div>
      <div className="section">
        <h3>Action Input</h3>
        <p>{formattedInput['Action Input']}</p>
      </div>
      <div className="section">
        <h3>Observation</h3>
        <pre>{JSON.stringify(observation, null, 2)}</pre>
      </div>
    </div>
  );
};

export default FormattedInput;