import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { currentGene, actions as activeActions } from '@broad/gene-page/src/resources/active'
import {
  uniqueGeneDiseaseNames,
  uniqueGeneDiseaseDiseases,
  currentDisease,
  actions as variantFxActions,
} from './redux'

import {
  DataSelectionGroup,
  DataSelectionContainer,
} from '@broad/gene-page/src/presentation/UserInterface'


const TopBarContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 40px;
  padding-top: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #000;
  background-color: #B71C1C;
  box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
`

const Logo = styled.div`
  color: white;
  font-size: 23px;
  margin-left: 40px;
  font-weight: bold;
`

const Search = styled.div`
  position: relative;
  left: 7px;
  font-size: 15px;
`

const SearchIconContainer = styled.span`
  position: absolute;
  left: 7px;
  font-size: 15px;
`

const SearchInput = styled.input`
  height: 20px;
  width: 275px;
  background-color: white;
  text-indent: 30px;
  -webkit-transition: width 0.4s ease-in-out;
  transition: width 0.4s ease-in-out;
`

const Menu = styled.div`
  display: flex;
  flex-direction: row;
  padding-top: 3px;
`

const MenuItem = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-right: 20px;
  color: white;
`

const StyledLink = styled(Link)`
  text-decoration: none;
`

const TopBar = ({
  setCurrentGene,
  uniqueGeneDiseaseNames,
  uniqueGeneDiseaseDiseases,
  currentDisease,
  setCurrentDisease,
}) => {
  return (
    <TopBarContainer>
      <StyledLink to={'/'}>
        <Logo>
          VariantFX
        </Logo>
      </StyledLink>
      <DataSelectionContainer>
        <select
          onChange={event => setCurrentDisease(event.target.value)}
          value={currentDisease}
        >
          <option value="DMC">Dilated cardiomyopathy</option>
          <option value="HCM">Hypertrophic cardiomyopathy</option>
        </select>
      </DataSelectionContainer>
      <Search>
        <SearchIconContainer>
        </SearchIconContainer>
        <form onSubmit={(event) => {
          event.preventDefault()
          setCurrentGene(event.target.elements[0].value)
        }}
        >
          <SearchInput
            type="text"
            name="search"
            placeholder="Search by gene, transcript, region, or variant"
            list="genes"
          />
          <datalist id="genes">
            {uniqueGeneDiseaseNames.map(gene => (
              <option key={`${gene}`} value={gene} />
            ))}
          </datalist>
        </form>
      </Search>
      <Menu>
        <MenuItem>About</MenuItem>
        <MenuItem>Downloads</MenuItem>
        <MenuItem>Terms</MenuItem>
        <MenuItem>Contact</MenuItem>
        <MenuItem>FAQ</MenuItem>
      </Menu>
    </TopBarContainer>
  )
}

const mapStateToProps = (state) => {
  return {
    currentGene: currentGene(state),
    uniqueGeneDiseaseNames: uniqueGeneDiseaseNames(state),
    uniqueGeneDiseaseDiseases: uniqueGeneDiseaseDiseases(state),
    uniqueGeneDiseaseDiseases: uniqueGeneDiseaseDiseases(state),
    currentDisease: currentDisease(state),
  }
}
const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentGene: geneName => dispatch(activeActions.setCurrentGene(geneName)),
    setCurrentDisease: disease => dispatch(variantFxActions.setCurrentDisease(disease)),
  }
}

TopBar.propTypes = {
  setCurrentGene: PropTypes.func.isRequired,
  setCurrentDisease: PropTypes.func.isRequired,
  uniqueGeneDiseaseNames: PropTypes.any.isRequired,
  uniqueGeneDiseaseDiseases: PropTypes.any.isRequired,
  currentDisease: PropTypes.string.isRequired,
}

export default connect(mapStateToProps, mapDispatchToProps)(TopBar)
