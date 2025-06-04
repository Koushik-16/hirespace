import React from 'react'
import Editor from './Editor'
import Meet from './Meet'
import { Box, Button } from '@mui/material'
import EndSession from './EndSession'

const Interview = () => {
  return (
    <Box display={"flex"} padding={'10px'}>
       <Meet  />
       <Box flex={2} marginLeft={"20px"}>
      <Editor />
    </Box>
     
    </Box>
  )
}

export default Interview
